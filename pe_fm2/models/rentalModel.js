const mongoose = require('mongoose');

// Định nghĩa cấu trúc dữ liệu đơn thuê
const rentalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ID người thuê (liên kết bảng User)
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }, // ID thiết bị (liên kết bảng Equipment)
    startDate: { type: Date, required: true }, // Ngày bắt đầu thuê
    endDate: { type: Date, required: true }, // Ngày kết thúc thuê dự kiến
    quantity: { type: Number, required: true }, // Số lượng thuê
    deposit: { type: Number, required: true }, // Tiền đặt cọc (tổng)
    fineAmount: { type: Number, default: 0 }, // Tiền phạt (nếu trả muộn)
    status: { type: String, enum: ['active', 'returned'], default: 'active' }, // Trạng thái đơn: active hoặc returned
    rentalDate: { type: Date, default: Date.now } // Ngày tạo đơn thuê thực tế
});

module.exports = mongoose.model('Rental', rentalSchema);