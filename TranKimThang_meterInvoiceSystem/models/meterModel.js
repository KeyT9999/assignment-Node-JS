const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  meterCode: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "CustomerAccount"
  },
  serviceZone: {
    type: String,
    required: true
  },
  currentReading: {
    type: Number,
    default: 0
  },
  lastReadingAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["active",
    "maintenance",
    "disconnected"],
    default: "active"
  },
});
module.exports = mongoose.model('Meter', schema);
