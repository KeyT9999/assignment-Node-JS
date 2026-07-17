const mongoose = require('mongoose');
const sequence = () => String(Math.floor(Math.random()*1000)).padStart(3, '0');
const code = (prefix = 'TXN') => `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${sequence()}`;
const schema = new mongoose.Schema({
  transactionCode: {
    type: String,
    unique: true,
    default: () => code()
  },
  type: {
    type: String,
    enum: ['import',
    'export',
    'transfer_out',
    'transfer_in'],
    required: true
  },
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
  destinationWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  note: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
schema.pre('validate', function(next) {
  this.totalValue = this.quantity*this.unitPrice;
  next()
});
module.exports = mongoose.model('StockTransaction', schema);
module.exports.generateCode = code;
