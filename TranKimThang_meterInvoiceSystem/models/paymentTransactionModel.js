const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  paymentCode: {
    type: String,
    unique: true
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Invoice"
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ["cash",
    "bank_transfer",
    "e_wallet"]
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
});
module.exports = mongoose.model('PaymentTransaction', schema);
