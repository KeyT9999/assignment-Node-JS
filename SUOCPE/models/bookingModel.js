const mongoose = require('mongoose');

/**
 * EXAM RENAMING REFERENCE FOR BOOKING MODEL:
 * 
 * 1. Co-working Space Booking:
 *    - Rename File: bookingModel.js -> reservationModel.js (and model name 'Booking' -> 'Reservation')
 *    - Fields:
 *      resourceId       -> spaceId
 *      quantityEstimate -> (can remove or keep as guestCount)
 *      totalAmount      -> totalAmount
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: bookingModel.js -> sessionModel.js (and model name 'Booking' -> 'Session')
 *    - Fields:
 *      resourceId       -> stationId
 *      quantityEstimate -> energyEstimate
 *      totalAmount      -> totalCost
 *      status           -> status (e.g. tracking: pending, active, completed, cancelled)
 * 
 * 3. Room Booking System:
 *    - Rename File: bookingModel.js -> bookingModel.js
 *    - Fields:
 *      resourceId       -> roomId
 *      quantityEstimate -> guestCount
 *      totalAmount      -> totalCost
 */

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: [true, 'Resource ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  quantityEstimate: {
    type: Number,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  note: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
