const mongoose = require('mongoose');
const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  pricePerDay: {
    type: Number,
    required: true,
    min: 0
  },
  depositFee: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Equipment', equipmentSchema);
