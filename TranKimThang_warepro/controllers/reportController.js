const Warehouse = require('../models/warehouseModel');
const Ledger = require('../models/stockLedgerModel');
const Transaction = require('../models/stockTransactionModel');
exports.stockSummary = async (req, res) => {
  const filter = req.query.warehouseId? {
    _id: req.query.warehouseId
  }
  : {
  };
  const warehouses = await Warehouse.find(filter).lean();
  const result = [];
  for (const w of warehouses) {
    const ledgers = await Ledger.find({
      warehouseId: w._id
    }).populate('productId', 'sku name').lean();
    result.push({
      warehouseId: w._id,
      warehouseCode: w.code,
      warehouseName: w.name,
      currentLoad: w.currentLoad,
      maxCapacity: w.maxCapacity,
      utilizationPercent: Number((w.currentLoad/w.maxCapacity*100).toFixed(1)),
      products: ledgers.map(l => ({
        product: l.productId,
        quantity: l.quantity
      }))
    })
  }
  res.json(result)
};
exports.transactions = async (req, res) => {
  const f = {
  };
  if (req.query.type)f.type = req.query.type;
  if (req.query.warehouseId)f.warehouseId = req.query.warehouseId;
  if (req.query.from || req.query.to) {
    f.createdAt = {
    };
    if (req.query.from)f.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) {
      const to = new Date(req.query.to);
      to.setHours(23, 59, 59, 999);
      f.createdAt.$lte = to
    }
  }
  res.json(await Transaction.find(f).populate('productId', 'sku name').populate('performedBy', 'username fullName').sort({
    createdAt: -1
  }))
};
