const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceCode: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  totalQuantity: {
    type: Number,
    required: true
  },
  availableQuantity: {
    type: Number,
    required: true
  },
  depositFee: {
    type: Number,
    required: true
  },
  finePerDay: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'maintenance'],
    default: 'available'
  }
});

module.exports = mongoose.model('Device', deviceSchema);
