/**
 * @file userModel.js
 * @description Định nghĩa Schema và Model người dùng (User) sử dụng Mongoose.
 * Bao gồm các trường thông tin cơ bản, mã hóa mật khẩu tự động trước khi lưu,
 * phương thức đối sánh mật khẩu và bộ lọc thuộc tính nhạy cảm khi chuyển sang JSON.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const authConfig = require('../config/authConfig');

/**
 * Định nghĩa cấu trúc cơ bản của User Schema.
 */
const fields = {
  username: {
    type: String,
    required: true,      // Bắt buộc nhập tên đăng nhập
    unique: true,        // Không được trùng lặp trong toàn bộ DB
    trim: true,          // Tự động cắt bỏ khoảng trắng thừa đầu/cuối
    lowercase: true      // Tự động chuẩn hóa thành chữ thường
  },
  password: {
    type: String,
    required: true,      // Bắt buộc nhập mật khẩu
    minlength: 6,        // Độ dài tối thiểu 6 ký tự
    select: false        // Mặc định ẩn thuộc tính này khỏi các truy vấn tìm kiếm để bảo mật
  },
  fullName: {
    type: String,
    required: true,      // Bắt buộc nhập họ và tên
    trim: true
  },
  role: {
    type: String,
    enum: authConfig.allowedRoles, // Giá trị phải thuộc danh sách các vai trò cấu hình hợp lệ
    default: authConfig.defaultRole // Vai trò mặc định gán khi tạo tài khoản
  },
  isActive: {
    type: Boolean,
    default: true        // Trạng thái kích hoạt tài khoản, mặc định là hoạt động (true)
  },
  balance: {
    type: Number,
    default: 0,
    min: 0               // Số dư tài khoản tối thiểu là 0 (không cho phép số dư âm)
  },
  createdAt: {
    type: Date,
    default: Date.now    // Tự động gán thời gian hiện tại lúc tạo tài khoản
  }
};

/**
 * Cấu hình động: Nếu cấu hình chỉ định trường liên kết (assignmentField),
 * ví dụ: assignedWarehouse, assignedStation,... thì tự động thêm trường này vào Schema.
 */
if (authConfig.assignmentField) {
  fields[authConfig.assignmentField] = {
    type: mongoose.Schema.Types.ObjectId,
    ref: authConfig.assignmentRef, // Model liên kết trong MongoDB (ví dụ: Warehouse, Station,...)
    default: null
  };
}

const userSchema = new mongoose.Schema(fields, {
  versionKey: false // Loại bỏ thuộc tính tự động __v của Mongoose
});

/**
 * Middleware pre('save'): Tự động băm (hash) mật khẩu bằng Bcrypt trước khi lưu vào DB.
 * Chỉ thực hiện băm khi mật khẩu có sự thay đổi (mới tạo hoặc cập nhật mật khẩu mới).
 */
userSchema.pre('save', async function hashPassword(next) {
  try {
    if (this.isModified('password')) {
      // Mã hóa mật khẩu với độ muối (salt rounds) là 10.
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Phương thức của instance User dùng để so sánh mật khẩu người dùng nhập vào với mật khẩu đã mã hóa lưu trong DB.
 * 
 * @function comparePassword
 * @param {string} candidate - Mật khẩu dạng thô cần đối sánh.
 * @returns {Promise<boolean>} Kết quả đối sánh (true nếu khớp, ngược lại false).
 */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Ghi đè phương thức toJSON để ẩn mật khẩu khi chuyển đổi đối tượng tài liệu Mongoose thành chuỗi JSON trả về cho Client.
 * Đảm bảo mật khẩu không bao giờ bị rò rỉ trong API response.
 * 
 * @function toJSON
 * @returns {Object} Đối tượng người dùng đã lược bỏ trường mật khẩu.
 */
userSchema.methods.toJSON = function safeJSON() {
  const value = this.toObject();
  delete value.password; // Xóa mật khẩu ra khỏi dữ liệu phản hồi
  return value;
};

module.exports = mongoose.model('User', userSchema);

