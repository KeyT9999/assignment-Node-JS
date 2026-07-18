const Reagent = require('../models/reagentModel');
const ReagentLedger = require('../models/reagentLedgerModel');
const ReagentTransaction = require('../models/reagentTransactionModel');
const Laboratory = require('../models/laboratoryModel');

exports.createReagent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'laboratory_manager') {
      return res.status(403).json({
        message: 'Forbidden: Only laboratory_manager can create reagents'
      });
    }

    const {
      reagentCode,
      name,
      unit,
      unitCost,
      reorderLevel,
      isActive
    } = req.body;

    if (!reagentCode || !name || !unit || unitCost === undefined || reorderLevel === undefined) {
      return res.status(400).json({
        message: 'reagentCode, name, unit, unitCost, and reorderLevel are required'
      });
    }

    if (unitCost <= 0 || reorderLevel < 0) {
      return res.status(400).json({
        message: 'unitCost must be greater than 0 and reorderLevel must be greater than or equal to 0'
      });
    }

    const exists = await Reagent.findOne({ reagentCode });
    if (exists) {
      return res.status(409).json({
        message: 'Reagent code already exists'
      });
    }

    const reagent = await Reagent.create({
      reagentCode,
      name,
      unit,
      unitCost,
      reorderLevel,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json(reagent);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.restock = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'laboratory_manager') {
      return res.status(403).json({
        message: 'Forbidden: Only laboratory_manager can restock reagents'
      });
    }

    const {
      reagentId,
      laboratoryId,
      batchNumber,
      expiryDate,
      quantity
    } = req.body;

    if (!reagentId || !laboratoryId || !batchNumber || !expiryDate || quantity === undefined) {
      return res.status(400).json({
        message: 'reagentId, laboratoryId, batchNumber, expiryDate, and quantity are required'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: 'Quantity must be greater than 0'
      });
    }

    const expDate = new Date(expiryDate);
    if (expDate <= new Date()) {
      return res.status(400).json({
        message: 'Expiry date must be in the future'
      });
    }

    const reagent = await Reagent.findById(reagentId);
    if (!reagent || !reagent.isActive) {
      return res.status(400).json({
        message: 'Active Reagent not found'
      });
    }

    const lab = await Laboratory.findById(laboratoryId);
    if (!lab || lab.status === 'inactive') {
      return res.status(400).json({
        message: 'Active Laboratory not found'
      });
    }

    // Check batch integrity
    let ledger = await ReagentLedger.findOne({
      reagentId,
      laboratoryId,
      batchNumber
    });

    if (ledger) {
      // Expiry dates must match if batch exists
      const existingDate = new Date(ledger.expiryDate).toISOString().slice(0, 10);
      const newDate = expDate.toISOString().slice(0, 10);
      if (existingDate !== newDate) {
        return res.status(409).json({
          message: `Batch ${batchNumber} already exists with a different expiry date (${existingDate})`
        });
      }
      ledger.quantity += Number(quantity);
      ledger.lastUpdated = Date.now();
      await ledger.save();
    } else {
      ledger = await ReagentLedger.create({
        reagentId,
        laboratoryId,
        batchNumber,
        expiryDate: expDate,
        quantity: Number(quantity),
        lastUpdated: Date.now()
      });
    }

    // Create restock transaction
    const transaction = await ReagentTransaction.create({
      type: 'restock',
      reagentId,
      laboratoryId,
      batchNumber,
      quantity: Number(quantity),
      unitCost: reagent.unitCost,
      performedBy: req.user.userId
    });

    res.status(201).json({
      message: 'Reagent restocked successfully',
      ledger,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.list = async (req, res) => {
  try {
    const {
      laboratoryId,
      expiringSoon,
      days,
      lowStock
    } = req.query;

    const query = { isActive: true };
    const reagents = await Reagent.find(query);

    const now = new Date();
    const resultList = [];

    for (const reagent of reagents) {
      // Find ledger entries
      const ledgerQuery = {
        reagentId: reagent._id,
        expiryDate: { $gt: now } // Only non-expired stock
      };

      if (laboratoryId) {
        ledgerQuery.laboratoryId = laboratoryId;
      }

      if (expiringSoon === 'true') {
        const d = Number(days) || 30;
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() + d);
        ledgerQuery.expiryDate.$lte = limitDate;
      }

      const ledgers = await ReagentLedger.find(ledgerQuery);
      const totalStock = ledgers.reduce((sum, item) => sum + item.quantity, 0);

      // Low stock check logic (aggregate non-expired stock across all laboratories or filter query, and compare with reorderLevel)
      // Note: If laboratoryId is filtered, we compare that lab's stock; otherwise total stock across all labs
      const isLowStock = totalStock < reagent.reorderLevel;

      if (lowStock === 'true' && !isLowStock) {
        continue;
      }

      resultList.push({
        reagent,
        totalStock,
        isLowStock,
        batches: ledgers.map(l => ({
          batchNumber: l.batchNumber,
          laboratoryId: l.laboratoryId,
          expiryDate: l.expiryDate,
          quantity: l.quantity
        }))
      });
    }

    res.json(resultList);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
