// File: models/scheduleModel.js
// Chức năng: Định nghĩa cấu trúc tài liệu (Schema) Lịch chiếu phim (Schedule) trong cơ sở dữ liệu MongoDB.

const mongoose = require('mongoose');

// Định nghĩa cấu trúc Schema cho một lịch chiếu phim cụ thể
const scheduleSchema = new mongoose.Schema({
    // Tên của bộ phim được chiếu (bắt buộc, ví dụ: Inception, Avatar)
    movieName: { type: String, required: true },
    
    // Tên rạp thực hiện buổi chiếu (bắt buộc, ví dụ: Cineplex Downtown)
    theaterName: { type: String, required: true },
    
    // Thời điểm bắt đầu chiếu (ngày và giờ) (bắt buộc)
    showTime: { type: Date, required: true },
    
    // Giá vé của mỗi suất chiếu phim (bắt buộc, ví dụ: 12.5 USD)
    ticketPrice: { type: Number, required: true },
    
    // Số ghế còn trống của phòng chiếu (bắt buộc)
    // Sẽ bị trừ bớt khi khách hàng đặt vé mới, hoặc cộng thêm khi khách hàng hủy vé
    availableSeats: { type: Number, required: true }
});

// Xuất model 'Schedule' để thực hiện các nghiệp vụ truy vấn lịch chiếu
module.exports = mongoose.model('Schedule', scheduleSchema);