const mongoose = require('mongoose');

// Định nghĩa cấu trúc dữ liệu thiết bị
const equipmentSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Tên thiết bị
    category: { type: String, required: true }, // Loại thiết bị
    pricePerDay: { type: Number, required: true }, // Giá thuê mỗi ngày
    depositFee: { type: Number, required: true }, // Phí đặt cọc
    stockQuantity: { type: Number, required: true }, // Số lượng trong kho
    createdAt: { type: Date, default: Date.now } // Ngày nhập thiết bị
});

module.exports = mongoose.model('Equipment', equipmentSchema);