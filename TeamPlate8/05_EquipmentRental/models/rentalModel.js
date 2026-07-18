const mongoose = require('mongoose');
const rentalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active',
    'returned'],
    default: 'active'
  },
  rentalDate: {
    type: Date,
    default: Date.now
  },
  returnDate: {
    type: Date,
    default: null
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  }
});
module.exports = mongoose.model('Rental', rentalSchema);
