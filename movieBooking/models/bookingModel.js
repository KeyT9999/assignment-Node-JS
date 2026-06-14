// File: models/bookingModel.js
// Chức năng: Định nghĩa cấu trúc tài liệu (Schema) Đặt vé (Booking) trong cơ sở dữ liệu MongoDB.

const mongoose = require('mongoose');

// Định nghĩa cấu trúc Schema cho một đơn đặt vé
const bookingSchema = new mongoose.Schema({
    // Tên của khách hàng đặt vé (bắt buộc)
    customerName: { type: String, required: true },
    
    // Tên rạp chiếu phim nơi khách chọn xem (bắt buộc)
    theaterName: { type: String, required: true },
    
    // Tên bộ phim khách đặt xem (bắt buộc)
    movieName: { type: String, required: true },
    
    // Suất chiếu phim (ngày và giờ) (bắt buộc)
    showTime: { type: Date, required: true },
    
    // Số lượng vé đặt mua (bắt buộc)
    numberOfTickets: { type: Number, required: true },
    
    // Tổng số tiền thanh toán cho đơn đặt vé (bắt buộc)
    // Tính bằng công thức: numberOfTickets * ticketPrice (từ bảng Lịch chiếu)
    totalAmount: { type: Number, required: true }
});

// Xuất model 'Booking' để có thể gọi các phương thức truy vấn như find(), create(), v.v. ở controller
module.exports = mongoose.model('Booking', bookingSchema);