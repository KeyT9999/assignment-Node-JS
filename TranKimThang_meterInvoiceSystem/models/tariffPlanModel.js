const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  tariffCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  tiers: [{
    minKwh: Number,
    maxKwh: Number,
    pricePerKwh: Number
  }],
  taxRate: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
});
module.exports = mongoose.model('TariffPlan', schema);
