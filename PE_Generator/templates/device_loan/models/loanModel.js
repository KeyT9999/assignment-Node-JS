const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnedAt: {
    type: Date,
    default: null
  },
  depositAmount: {
    type: Number,
    required: true
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['borrowing', 'returned'],
    default: 'borrowing'
  }
});

module.exports = mongoose.model('Loan', loanSchema);
