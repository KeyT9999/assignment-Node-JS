/**
 * @file userModel.js
 * @description Schema định nghĩa đối tượng người dùng (User) trong hệ thống trạm sạc xe điện.
 * Quản lý thông tin tài khoản, vai trò phân quyền (admin/customer) và số dư tài khoản của khách hàng.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'], // Tên đăng nhập bắt buộc phải có
    unique: true,                              // Tên đăng nhập duy nhất
    trim: true                                 // Cắt bỏ khoảng trắng thừa đầu/cuối
  },
  password: {
    type: String,
    required: [true, 'Password is required']  // Mật khẩu bắt buộc phải có
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],               // Các vai trò phân quyền được phép
    default: 'customer'                        // Mặc định đăng ký là khách hàng (customer)
  },
  balance: {
    type: Number,
    default: 0                                 // Số dư tài khoản khách hàng để thực hiện trả tiền sạc xe
  },
  createdAt: {
    type: Date,
    default: Date.now                          // Thời điểm tạo tài khoản
  }
});

module.exports = mongoose.model('User', userSchema);

