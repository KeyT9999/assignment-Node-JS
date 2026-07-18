// Thư viện Mongoose dùng để quản lý schema và kết nối MongoDB
const mongoose = require('mongoose');

// Định nghĩa cấu trúc lược đồ (Schema) cho Đơn đặt chỗ (Reservations/Bookings)
const bookingSchema = new mongoose.Schema({
  // Liên kết (Tham chiếu) tới ID của người dùng đặt chỗ (User)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Khai báo liên kết với collection 'User'
    required: [true, 'User ID is required'] // Bắt buộc phải có thông tin khách hàng
  },
  // Liên kết (Tham chiếu) tới ID của không gian được đặt (Space)
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space', // Khai báo liên kết với collection 'Space'
    required: [true, 'Space ID is required'] // Bắt buộc phải có thông tin không gian
  },
  // Thời gian bắt đầu đặt chỗ
  startTime: {
    type: Date,
    required: [true, 'Start time is required'] // Bắt buộc phải nhập thời gian bắt đầu
  },
  // Thời gian kết thúc đặt chỗ
  endTime: {
    type: Date,
    required: [true, 'End time is required'] // Bắt buộc phải nhập thời gian kết thúc
  },

  // Tổng số tiền cần thanh toán cho lượt đặt chỗ này
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'] // Bắt buộc phải có giá trị tổng tiền
  },
  // Ghi chú của khách hàng khi đặt chỗ (nếu có)
  note: {
    type: String,
    trim: true // Tự động loại bỏ khoảng trắng dư thừa
  }
});

// Xuất model 'Reservation' từ bookingSchema để sử dụng
module.exports = mongoose.model('Reservation', bookingSchema);
