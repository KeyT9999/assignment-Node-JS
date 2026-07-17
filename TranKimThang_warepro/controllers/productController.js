const Product = require('../models/productModel');
const Ledger = require('../models/stockLedgerModel');
exports.create = async (req, res) => {
  try {
    if (Number(req.body.unitPrice) <= 0)return res.status(400).json({
      message: 'unitPrice must be greater than 0'
    });
    if (await Product.exists({
      sku: req.body.sku
    }))return res.status(409).json({
      message: 'SKU already exists'
    });
    res.status(201).json(await Product.create(req.body))
  } catch (e) {
    res.status(400).json({
      message: e.message
    })
  }
};
exports.list = async (req, res) => {
  const filter = {
  };
  if (req.query.category)filter.category = req.query.category;
  let products = await Product.find(filter).lean();
  if (req.query.lowStock === 'true') {
    const totals = await Ledger.aggregate([{
      $group: {
        _id: '$productId',
        total: {
          $sum: '$quantity'
        }
      }
    }]);
    const map = new Map(totals.map(x => [String(x._id), x.total]));
    products = products.filter(p => (map.get(String(p._id)) || 0)<p.reorderLevel).map(p => ({
      ...p,
      totalStock: map.get(String(p._id)) || 0,
      lowStock: true
    }))
  }
  res.json(products)
};
