const mongoose = require('mongoose');

/**
 * EXAM RENAMING REFERENCE FOR RESOURCE MODEL:
 * 
 * 1. Co-working Space Booking:
 *    - Rename File: resourceModel.js -> spaceModel.js (and model name 'Resource' -> 'Space')
 *    - Fields:
 *      resourceCode -> spaceCode
 *      pricePerUnit -> pricePerHour
 *      features     -> amenities
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: resourceModel.js -> stationModel.js (and model name 'Resource' -> 'Station')
 *    - Fields:
 *      resourceCode -> stationCode
 *      pricePerUnit -> pricePerKwh
 *      features     -> connectors
 * 
 * 3. Room Booking System:
 *    - Rename File: resourceModel.js -> roomModel.js
 *    - Fields:
 *      resourceCode -> roomCode
 *      pricePerUnit -> pricePerNight (or pricePerHour)
 *      features     -> facilities
 */

const resourceSchema = new mongoose.Schema({
  resourceCode: {
    type: String,
    required: [true, 'Resource code is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
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
  pricePerUnit: {
    type: Number,
    required: [true, 'Price per unit is required']
  },
  features: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
