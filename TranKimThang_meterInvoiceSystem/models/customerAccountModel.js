const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  accountCode: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  serviceZone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["active",
    "suspended",
    "closed"],
    default: "active"
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
});
module.exports = mongoose.model('CustomerAccount', schema);
