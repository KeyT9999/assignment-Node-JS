const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  invoiceCode: {
    type: String,
    unique: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "CustomerAccount"
  },
  meterReadingId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: "MeterReading"
  },
  tariffId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "TariffPlan"
  },
  subtotal: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["unpaid",
    "partially_paid",
    "paid",
    "overdue"],
    default: "unpaid"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});
module.exports = mongoose.model('Invoice', schema);
