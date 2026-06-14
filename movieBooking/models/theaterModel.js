// File: models/theaterModel.js
// Chức năng: Định nghĩa cấu trúc tài liệu (Schema) Rạp chiếu phim (Theater) trong cơ sở dữ liệu MongoDB.

const mongoose = require('mongoose');

// Định nghĩa cấu trúc Schema lưu trữ thông tin của Rạp chiếu phim
const theaterSchema = new mongoose.Schema({
    // Tên rạp chiếu (bắt buộc, ví dụ: Cineplex Downtown)
    theaterName: { type: String, required: true },
    
    // Địa chỉ của rạp chiếu phim (bắt buộc)
    location: { type: String, required: true },
    
    // Tổng số ghế ngồi tối đa của rạp phim (bắt buộc)
    seatCapacity: { type: Number, required: true },
    
    // Loại màn hình trình chiếu (bắt buộc, ví dụ: IMAX, 3D, Standard)
    screenType: { type: String, required: true },
    
    // Danh sách các dịch vụ tiện ích đi kèm rạp phim (ví dụ: ghế ngả lưng recliner, âm thanh Dolby Atmos, quầy bỏng nước)
    amenities: [String]
});

// Xuất model 'Theater' để thực hiện các truy vấn thông tin rạp chiếu
module.exports = mongoose.model('Theater', theaterSchema);