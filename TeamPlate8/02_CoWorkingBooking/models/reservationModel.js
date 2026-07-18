const mongoose = require('mongoose');
/**
 * EXAM RENAMING REFERENCE FOR BOOKING MODEL:
 * 
 * 1. Co-working Space Reservation:
 *    - Rename File: reservationModel.js -> reservationModel.js (and model name 'Reservation' -> 'Reservation')
 *    - Fields:
 *      spaceId       -> spaceId
 *      quantityEstimate -> (can remove or keep as guestCount)
 *      totalAmount      -> totalAmount
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: reservationModel.js -> sessionModel.js (and model name 'Reservation' -> 'Session')
 *    - Fields:
 *      spaceId       -> stationId
 *      quantityEstimate -> energyEstimate
 *      totalAmount      -> totalCost
 *      status           -> status (e.g. tracking: pending, active, completed, cancelled)
 * 
 * 3. Room Reservation System:
 *    - Rename File: reservationModel.js -> reservationModel.js
 *    - Fields:
 *      spaceId       -> roomId
 *      quantityEstimate -> guestCount
 *      totalAmount      -> totalCost
 */ const reservationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true,
    'User ID is required']
  },
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: [true,
    'Space ID is required']
  },
  startTime: {
    type: Date,
    required: [true,
    'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true,
    'End time is required']
  },
  quantityEstimate: {
    type: Number,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: [true,
    'Total amount is required']
  },
  note: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending',
    'active',
    'completed',
    'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Reservation', reservationSchema);
