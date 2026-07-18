const Sample = require('../models/sampleModel');
const Laboratory = require('../models/laboratoryModel');
const TestCatalogue = require('../models/testCatalogueModel');
const Reagent = require('../models/reagentModel');
const ReagentLedger = require('../models/reagentLedgerModel');
const ReagentTransaction = require('../models/reagentTransactionModel');
const TestExecution = require('../models/testExecutionModel');

exports.list = async (req, res) => {
  try {
    // Under RBAC, technician only sees samples of their assigned lab
    // Auditor and Manager can see all
    let query = {};
    if (req.user && req.user.role === 'laboratory_technician') {
      query.laboratoryId = req.user.assignedLaboratory;
    }
    const samples = await Sample.find(query)
      .populate('laboratoryId')
      .populate('testId')
      .populate('registeredBy', 'username fullName');
    res.json(samples);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      patientCode,
      patientName,
      laboratoryId,
      testId,
      sampleType,
      collectedAt,
      priority
    } = req.body;

    if (!patientCode || !patientName || !laboratoryId || !testId || !sampleType || !collectedAt) {
      return res.status(400).json({ message: 'Missing required sample fields' });
    }

    // Authorization check
    if (req.user.role === 'laboratory_technician' && String(req.user.assignedLaboratory) !== String(laboratoryId)) {
      return res.status(403).json({ message: 'Technicians can only register samples at their assigned laboratory' });
    }

    const lab = await Laboratory.findById(laboratoryId);
    if (!lab || lab.status === 'inactive') {
      return res.status(400).json({ message: 'Laboratory does not exist or is inactive' });
    }

    // Capacity validation
    if (lab.currentActiveSamples >= lab.maximumActiveSamples) {
      return res.status(409).json({ message: 'Laboratory active-sample capacity exceeded' });
    }

    const test = await TestCatalogue.findById(testId);
    if (!test || !test.isActive) {
      return res.status(400).json({ message: 'Test Catalogue does not exist or is inactive' });
    }

    if (test.sampleType !== sampleType) {
      return res.status(400).json({ message: `Sample type mismatch. Expected: ${test.sampleType}` });
    }

    const colDate = new Date(collectedAt);
    const now = new Date();
    if (colDate > now) {
      return res.status(400).json({ message: 'collectedAt cannot be in the future' });
    }

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (colDate < twentyFourHoursAgo) {
      return res.status(400).json({ message: 'collectedAt cannot be more than 24 hours in the past' });
    }

    // Atomic write
    const sample = await Sample.create({
      patientCode,
      patientName,
      laboratoryId,
      testId,
      sampleType,
      collectedAt: colDate,
      priority: priority || 'routine',
      status: 'received',
      registeredBy: req.user.userId
    });

    lab.currentActiveSamples += 1;
    if (lab.currentActiveSamples >= lab.maximumActiveSamples) {
      lab.status = 'full';
    }
    await lab.save();

    res.status(201).json(sample);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.startTest = async (req, res) => {
  try {
    const { id } = req.params;
    const sample = await Sample.findById(id);

    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    if (sample.status !== 'received') {
      return res.status(400).json({ message: 'Sample status must be received to start test' });
    }

    if (req.user.role === 'laboratory_technician' && String(sample.laboratoryId) !== String(req.user.assignedLaboratory)) {
      return res.status(403).json({ message: 'Sample does not belong to technician\'s assigned laboratory' });
    }

    const test = await TestCatalogue.findById(sample.testId);
    if (!test || !test.isActive) {
      return res.status(400).json({ message: 'Test Catalogue is inactive or not found' });
    }

    const now = new Date();

    // 1. FEFO Reagent Pre-Check (Check stock availability before writing)
    const requiredReagents = test.requiredReagents || [];
    const reagentMap = new Map(); // reagentId -> details

    for (const reqReagent of requiredReagents) {
      const reagent = await Reagent.findById(reqReagent.reagentId);
      if (!reagent || !reagent.isActive) {
        return res.status(400).json({ message: `Required reagent ${reqReagent.reagentId} is inactive or not found` });
      }

      // Aggregate non-expired stock in this laboratory
      const activeLedgers = await ReagentLedger.find({
        reagentId: reqReagent.reagentId,
        laboratoryId: sample.laboratoryId,
        expiryDate: { $gt: now },
        quantity: { $gt: 0 }
      });

      const totalAvailable = activeLedgers.reduce((sum, item) => sum + item.quantity, 0);
      if (totalAvailable < reqReagent.quantityRequired) {
        return res.status(409).json({
          message: `Insufficient reagent stock: ${reagent.name}. Available: ${totalAvailable}, required: ${reqReagent.quantityRequired}`
        });
      }

      reagentMap.set(String(reqReagent.reagentId), {
        reagent,
        requiredQuantity: reqReagent.quantityRequired,
        ledgers: activeLedgers.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)) // FEFO sorting
      });
    }

    // 2. Perform FEFO Deductions & Create Transactions
    let totalReagentCost = 0;
    const transactionsToCreate = [];

    for (const [reagentIdStr, info] of reagentMap.entries()) {
      let needed = info.requiredQuantity;
      const { reagent, ledgers } = info;

      for (const ledger of ledgers) {
        if (needed <= 0) break;

        let consumed = 0;
        if (ledger.quantity >= needed) {
          consumed = needed;
          ledger.quantity -= needed;
          needed = 0;
        } else {
          consumed = ledger.quantity;
          needed -= ledger.quantity;
          ledger.quantity = 0;
        }

        ledger.lastUpdated = now;
        await ledger.save();

        totalReagentCost += consumed * reagent.unitCost;

        transactionsToCreate.push({
          type: 'consume',
          reagentId: reagent._id,
          laboratoryId: sample.laboratoryId,
          batchNumber: ledger.batchNumber,
          quantity: consumed,
          unitCost: reagent.unitCost,
          sampleId: sample._id,
          performedBy: req.user.userId
        });
      }
    }

    // Save Transactions
    const createdTransactions = await ReagentTransaction.insertMany(transactionsToCreate);

    // Calculate Costs
    const totalCost = test.standardFee + totalReagentCost;

    // Create Test Execution
    const testExecution = await TestExecution.create({
      sampleId: sample._id,
      testId: test._id,
      laboratoryId: sample.laboratoryId,
      reagentCost: totalReagentCost,
      testFee: test.standardFee,
      totalCost,
      resultStatus: 'pending',
      performedBy: req.user.userId
    });

    // Update Sample
    sample.status = 'in_progress';
    sample.startedAt = now;
    await sample.save();

    // 3. Generate Low Stock Warnings
    const lowStockWarnings = [];
    for (const reqReagent of requiredReagents) {
      const allActiveLedgers = await ReagentLedger.find({
        reagentId: reqReagent.reagentId,
        laboratoryId: sample.laboratoryId,
        expiryDate: { $gt: now }
      });
      const totalRemaining = allActiveLedgers.reduce((sum, item) => sum + item.quantity, 0);
      const reagent = await Reagent.findById(reqReagent.reagentId);

      if (reagent && totalRemaining < reagent.reorderLevel) {
        lowStockWarnings.push({
          reagentId: reagent._id,
          reagentCode: reagent.reagentCode,
          name: reagent.name,
          remainingStock: totalRemaining,
          reorderLevel: reagent.reorderLevel
        });
      }
    }

    res.json({
      message: 'Test started successfully',
      sample,
      testExecution,
      lowStockWarnings
    });

  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resultStatus, resultSummary, rejectionReason } = req.body;

    const sample = await Sample.findById(id);
    if (!sample) {
      return res.status(404).json({ message: 'Sample not found' });
    }

    // Check if already processed
    if (['completed', 'rejected', 'cancelled'].includes(sample.status)) {
      return res.status(400).json({ message: 'Completed, rejected or cancelled sample cannot be processed again' });
    }

    const lab = await Laboratory.findById(sample.laboratoryId);
    const now = new Date();

    if (action === 'complete') {
      if (sample.status !== 'in_progress') {
        return res.status(400).json({ message: 'Sample status must be in_progress to complete' });
      }

      if (!resultStatus || !['normal', 'abnormal', 'inconclusive'].includes(resultStatus)) {
        return res.status(400).json({ message: 'Valid resultStatus is required (normal, abnormal, inconclusive)' });
      }

      if (!resultSummary) {
        return res.status(400).json({ message: 'resultSummary is required' });
      }

      // Update Sample
      sample.status = 'completed';
      sample.completedAt = now;
      await sample.save();

      // Update Test Execution
      const execution = await TestExecution.findOne({ sampleId: sample._id });
      if (execution) {
        execution.resultStatus = resultStatus;
        execution.resultSummary = resultSummary;
        execution.performedBy = req.user.userId;
        await execution.save();
      }

      // Decrement lab active count
      if (lab) {
        lab.currentActiveSamples = Math.max(0, lab.currentActiveSamples - 1);
        if (lab.currentActiveSamples < lab.maximumActiveSamples && lab.status === 'full') {
          lab.status = 'active';
        }
        await lab.save();
      }

      // TurnaroundMinutes calculation
      const turnaroundMinutes = Math.round((sample.completedAt - sample.receivedAt) / (1000 * 60));

      return res.json({
        message: 'Sample completed successfully',
        sample,
        turnaroundMinutes
      });

    } else if (action === 'reject') {
      if (!['received', 'in_progress'].includes(sample.status)) {
        return res.status(400).json({ message: 'Sample status must be received or in_progress to reject' });
      }

      if (!rejectionReason) {
        return res.status(400).json({ message: 'rejectionReason is required' });
      }

      // Update Sample
      sample.status = 'rejected';
      sample.rejectionReason = rejectionReason;
      await sample.save();

      // Decrement lab active count
      if (lab) {
        lab.currentActiveSamples = Math.max(0, lab.currentActiveSamples - 1);
        if (lab.currentActiveSamples < lab.maximumActiveSamples && lab.status === 'full') {
          lab.status = 'active';
        }
        await lab.save();
      }

      return res.json({
        message: 'Sample rejected successfully',
        sample
      });

    } else {
      return res.status(400).json({ message: 'Invalid action. Must be complete or reject' });
    }

  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
