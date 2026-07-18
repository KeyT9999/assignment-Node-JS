const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  reagentCode: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0.01
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Reagent', schema);
