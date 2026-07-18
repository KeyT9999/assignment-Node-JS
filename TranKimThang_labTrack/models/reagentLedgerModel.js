const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  reagentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reagent',
    required: true
  },
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index: reagentId + laboratoryId + batchNumber must be unique
schema.index({ reagentId: 1, laboratoryId: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('ReagentLedger', schema);
