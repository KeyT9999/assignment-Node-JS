const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true }, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true }, lineTotal: { type: Number, required: true } }],
  deliveryAddress: { type: String, required: true },
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending','confirmed','preparing','delivering','completed','cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Order', schema);
