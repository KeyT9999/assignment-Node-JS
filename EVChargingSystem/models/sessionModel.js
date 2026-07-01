const mongoose = require("mongoose");

// Định nghĩa cấu trúc lược đồ (Schema) cho thực thể Phiên đặt chỗ/Sạc điện (Session)
const sessionSchema = new mongoose.Schema({
  // Liên kết khóa ngoại (Foreign Key) tới bảng User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",                                // Tham chiếu đến model 'User'
    required: [true, "User ID is required"]     // Bắt buộc phải có thông tin ID người đặt sạc
  },

  // Liên kết khóa ngoại (Foreign Key) tới bảng Station
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",                             // Tham chiếu đến model 'Station'
    required: [true, "Station ID is required"]  // Bắt buộc phải có thông tin ID trạm sạc
  },

  // Thời điểm bắt đầu phiên sạc đã đặt trước
  startTime: {
    type: Date,
    required: [true, "Start time is required"]  // Bắt buộc nhập thời điểm bắt đầu
  },

  // Thời điểm kết thúc phiên sạc
  endTime: {
    type: Date,
    required: [true, "End time is required"]    // Bắt buộc nhập thời điểm kết thúc
  },

  // Số lượng điện năng ước tính tiêu thụ trong suốt phiên sạc (đơn vị: kWh)
  energyEstimate: {
    type: Number,
    required: [true, "Energy estimate is required"] // Bắt buộc lưu trữ điện năng tiêu thụ dự tính
  },

  // Tổng số tiền thanh toán cho phiên sạc (đã tính chiết khấu Happy Hour nếu có)
  totalCost: {
    type: Number,
    required: [true, "Total cost is required"]      // Bắt buộc phải lưu tổng số tiền thanh toán
  },

  // Trạng thái của phiên sạc
  status: {
    type: String,
    default: "pending"                              // Trạng thái mặc định ban đầu là đang chờ sạc (pending)
  }
});

module.exports = mongoose.model("Session", sessionSchema);