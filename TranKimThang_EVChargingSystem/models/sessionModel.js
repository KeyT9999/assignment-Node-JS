const mongoose = require('mongoose');
/**
 * EXAM RENAMING REFERENCE FOR BOOKING MODEL:
 * 
 * 1. Co-working Space Session:
 *    - Rename File: sessionModel.js -> reservationModel.js (and model name 'Session' -> 'Reservation')
 *    - Fields:
 *      stationId       -> spaceId
 *      energyEstimate -> (can remove or keep as guestCount)
 *      totalCost      -> totalCost
 * 
 * 2. Smart EV Charging Station:
 *    - Rename File: sessionModel.js -> sessionModel.js (and model name 'Session' -> 'Session')
 *    - Fields:
 *      stationId       -> stationId
 *      energyEstimate -> energyEstimate
 *      totalCost      -> totalCost
 *      status           -> status (e.g. tracking: pending, active, completed, cancelled)
 * 
 * 3. Room Session System:
 *    - Rename File: sessionModel.js -> sessionModel.js
 *    - Fields:
 *      stationId       -> roomId
 *      energyEstimate -> guestCount
 *      totalCost      -> totalCost
 */ 
const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'] // Liên kết với tài khoản người dùng thực hiện sạc xe
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    required: [true, 'Station ID is required'] // Liên kết với trạm sạc xe điện
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'] // Thời điểm bắt đầu sạc dự kiến
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'] // Thời điểm kết thúc sạc dự kiến
  },
  energyEstimate: {
    type: Number,
    default: 1                                 // Ước lượng năng lượng tiêu thụ (kWh)
  },
  totalCost: {
    type: Number,
    required: [true, 'Total amount is required'] // Tổng chi phí dự tính cho phiên sạc
  },
  note: {
    type: String,
    trim: true                                 // Ghi chú thêm
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'], // Các trạng thái của phiên sạc
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now                          // Thời điểm tạo phiên sạc
  }
});
module.exports = mongoose.model('Session', sessionSchema);

