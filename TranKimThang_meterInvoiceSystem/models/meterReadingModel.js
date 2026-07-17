const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  readingCode: {
    type: String,
    unique: true
  },
  meterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Meter"
  },
  previousReading: {
    type: Number,
    required: true
  },
  currentReading: {
    type: Number,
    required: true
  },
  consumptionKwh: {
    type: Number,
    required: true
  },
  billingMonth: {
    type: String,
    required: true
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
});
schema.index({
  meterId: 1,
  billingMonth: 1
}, {
  unique: true
});
module.exports = mongoose.model('MeterReading', schema);
