// Thư viện Mongoose dùng để thiết lập schema và tương tác với MongoDB
const mongoose = require('mongoose');

// Định nghĩa cấu trúc lược đồ (Schema) cho người dùng trong hệ thống
const userSchema = new mongoose.Schema({
  // Tên tài khoản người dùng
  username: {
    type: String,
    required: [true, 'Username is required'], // Bắt buộc phải nhập tên đăng nhập
    unique: true, // Không cho phép trùng tên đăng nhập
    trim: true // Tự động loại bỏ khoảng trắng thừa ở đầu/cuối
  },
  // Mật khẩu người dùng (sẽ được mã hóa trước khi lưu)
  password: {
    type: String,
    required: [true, 'Password is required'] // Bắt buộc phải nhập mật khẩu
  },
  // Vai trò của người dùng trong hệ thống
  role: {
    type: String,
    enum: ['admin', 'customer'], // Giới hạn chỉ thuộc nhóm vai trò admin hoặc customer
    default: 'customer' // Mặc định khi tạo mới là customer
  },
  // Số dư tài khoản (ví điện tử) của người dùng
  balance: {
    type: Number,
    default: 0 // Mặc định ban đầu là 0
  },
  // Thời gian tạo tài khoản
  createdAt: {
    type: Date,
    default: Date.now // Mặc định lấy thời gian hiện tại lúc tạo
  }
});

// Xuất model 'User' từ userSchema để sử dụng ở các nơi khác
module.exports = mongoose.model('User', userSchema);
