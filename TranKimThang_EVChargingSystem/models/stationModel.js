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
 */ 
const stationSchema = new mongoose.Schema({
  stationCode: {
    type: String,
    required: [true, 'Station code is required'], // Mã trạm sạc là bắt buộc
    unique: true,                                  // Phải là duy nhất
    trim: true                                     // Tự động cắt bỏ khoảng trắng đầu/cuối
  },
  name: {
    type: String,
    trim: true                                     // Tên trạm sạc
  },
  type: {
    type: String,
    required: [true, 'Type is required']          // Loại trạm sạc (ví dụ: AC, DC, Fast Charging)
  },
  capacity: {
    type: Number,
    default: 1                                     // Sức chứa (số lượng đầu sạc / ô tô có thể đỗ sạc cùng lúc)
  },
  status: {
    type: String,
    enum: ['available', 'maintenance', 'offline'], // Trạng thái trạm sạc: khả dụng, bảo trì, hoặc ngoại tuyến
    default: 'available'
  },
  pricePerKwh: {
    type: Number,
    required: [true, 'Price per unit is required'] // Đơn giá trên mỗi Kwh điện tiêu thụ
  },
  connectors: {
    type: [String],
    default: []                                    // Các loại cổng kết nối / đầu sạc hỗ trợ (ví dụ: CCS2, CHAdeMO, Type 2)
  },
  createdAt: {
    type: Date,
    default: Date.now                              // Thời điểm ghi nhận trạm sạc vào hệ thống
  }
});
module.exports = mongoose.model('Station', stationSchema);

