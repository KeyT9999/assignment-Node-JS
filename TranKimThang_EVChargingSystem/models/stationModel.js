const mongoose = require('mongoose');
/**
 * EXAM RENAMING REFERENCE FOR RESOURCE MODEL:
 * 
 * 1. Co-working Space Session:
 *    - Rename File: stationModel.js -> spaceModel.js (and model name 'Station' -> 'Space')
 *    - Fields:
 *      stationCode -> spaceCode
 *      pricePerKwh -> pricePerHour
 *      connectors     -> amenities
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: stationModel.js -> stationModel.js (and model name 'Station' -> 'Station')
 *    - Fields:
 *      stationCode -> stationCode
 *      pricePerKwh -> pricePerKwh
 *      connectors     -> connectors
 * 
 * 3. Room Session System:
 *    - Rename File: stationModel.js -> roomModel.js
 *    - Fields:
 *      stationCode -> roomCode
 *      pricePerKwh -> pricePerNight (or pricePerHour)
 *      connectors     -> facilities
 */ const stationSchema = new mongoose.Schema({
  stationCode: {
    type: String,
    required: [true,
    'Station code is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: [true,
    'Type is required']
  },
  capacity: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['available',
    'maintenance',
    'offline'],
    default: 'available'
  },
  pricePerKwh: {
    type: Number,
    required: [true,
    'Price per unit is required']
  },
  connectors: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Station', stationSchema);
