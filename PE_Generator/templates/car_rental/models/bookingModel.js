const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  carNumber: { type: String, required: true, trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true, min: 0 }
}, { timestamps: true });
module.exports = mongoose.model('Booking', bookingSchema);
