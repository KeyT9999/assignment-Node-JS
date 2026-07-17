const mongoose = require('mongoose');
const carSchema = new mongoose.Schema({
  carNumber: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['available', 'rented', 'maintenance'], default: 'available' },
  pricePerDay: { type: Number, required: true, min: 0 },
  features: [{ type: String }]
});
module.exports = mongoose.model('Car', carSchema);
