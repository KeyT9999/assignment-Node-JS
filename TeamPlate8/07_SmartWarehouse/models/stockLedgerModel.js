const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});
schema.index({
  productId: 1,
  warehouseId: 1
}, {
  unique: true
});
module.exports = mongoose.model('StockLedger', schema);
