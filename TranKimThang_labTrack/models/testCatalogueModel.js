const mongoose = require('mongoose');

const reagentRequirementSchema = new mongoose.Schema({
  reagentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reagent',
    required: true
  },
  quantityRequired: {
    type: Number,
    required: true,
    min: 0.0001
  }
}, { _id: false });

const schema = new mongoose.Schema({
  testCode: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  sampleType: {
    type: String,
    required: true
  },
  standardFee: {
    type: Number,
    required: true,
    min: 0.01
  },
  estimatedMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  requiredReagents: {
    type: [reagentRequirementSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestCatalogue', schema);
