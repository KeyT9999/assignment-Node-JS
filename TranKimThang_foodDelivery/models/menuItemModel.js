const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  itemCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['food','drink','dessert'], required: true },
  price: { type: Number, required: true, min: 0 },
  stockQuantity: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['available','unavailable'], default: 'available' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('MenuItem', schema);
