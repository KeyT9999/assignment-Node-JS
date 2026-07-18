const mongoose = require('mongoose');
/**
 * EXAM RENAMING REFERENCE FOR RESOURCE MODEL:
 * 
 * 1. Co-working Space Reservation:
 *    - Rename File: spaceModel.js -> spaceModel.js (and model name 'Space' -> 'Space')
 *    - Fields:
 *      spaceCode -> spaceCode
 *      pricePerHour -> pricePerHour
 *      amenities     -> amenities
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: spaceModel.js -> stationModel.js (and model name 'Space' -> 'Station')
 *    - Fields:
 *      spaceCode -> stationCode
 *      pricePerHour -> pricePerKwh
 *      amenities     -> connectors
 * 
 * 3. Room Reservation System:
 *    - Rename File: spaceModel.js -> roomModel.js
 *    - Fields:
 *      spaceCode -> roomCode
 *      pricePerHour -> pricePerNight (or pricePerHour)
 *      amenities     -> facilities
 */ const spaceSchema = new mongoose.Schema({
  spaceCode: {
    type: String,
    required: [true,
    'Space code is required'],
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
  pricePerHour: {
    type: Number,
    required: [true,
    'Price per unit is required']
  },
  amenities: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Space', spaceSchema);
