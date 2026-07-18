const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  zoneCode: {
    type: String,
    required: true,
    unique: true
  },
  zoneName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active',
    'suspended'],
    default: 'active'
  },
  maxWeightKg: {
    type: Number,
    required: true
  },
  baseFee: {
    type: Number,
    required: true
  },
  feePerKm: {
    type: Number,
    required: true
  },
  feePerKg: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('DeliveryZone', schema);
