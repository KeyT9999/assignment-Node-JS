const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  laboratoryCode: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  maximumActiveSamples: {
    type: Number,
    required: true,
    min: 1
  },
  currentActiveSamples: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'full'],
    default: 'active'
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Laboratory', schema);
