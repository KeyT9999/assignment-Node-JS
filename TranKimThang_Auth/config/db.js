/**
 * @file db.js
 * @description Cấu hình và thiết lập kết nối tới cơ sở dữ liệu MongoDB bằng Mongoose.
 * Đảm bảo ứng dụng kết nối thành công trước khi xử lý các truy vấn.
 */

const mongoose = require('mongoose');

/**
 * Kết nối tới cơ sở dữ liệu MongoDB.
 * Kiểm tra trạng thái kết nối hiện tại để tránh tạo nhiều kết nối trùng lặp.
 * 
 * @async
 * @function connectDB
 * @returns {Promise<mongoose.Connection>} Trả về đối tượng kết nối Mongoose hoạt động.
 * @throws {Error} Ném ra lỗi nếu biến môi trường MONGODB_URI không được cấu hình.
 */
async function connectDB() {
  // Nếu đã kết nối thành công (readyState === 1), trả về đối tượng kết nối hiện tại ngay lập tức.
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  
  // Lấy đường dẫn URI kết nối MongoDB từ biến môi trường.
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  
  // Tiến hành kết nối tới MongoDB thông qua Mongoose.
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  
  return mongoose.connection;
}

module.exports = connectDB;

