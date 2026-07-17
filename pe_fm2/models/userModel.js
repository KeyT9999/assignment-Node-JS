const mongoose = require('mongoose');

// Định nghĩa cấu trúc dữ liệu người dùng
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Tên đăng nhập (duy nhất)
    password: { type: String, required: true }, // Mật khẩu (đã được hash)
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' }, // Vai trò: admin hoặc customer
    createdAt: { type: Date, default: Date.now } // Ngày tạo tài khoản
});

module.exports = mongoose.model('User', userSchema);