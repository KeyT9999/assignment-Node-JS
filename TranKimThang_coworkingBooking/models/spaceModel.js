const mongoose = require('mongoose');



const resourceSchema = new mongoose.Schema({
  spaceCode: {
    type: String,
    required: [true, 'Space code is required'],
    unique: true,
    trim: true
  },
  
  type: {
    type: String,
    required: [true, 'Type is required']
  },
  capacity: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'offline'],
    default: 'available'
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Price per unit is required']
  },
  amenities: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model('Space', resourceSchema);
