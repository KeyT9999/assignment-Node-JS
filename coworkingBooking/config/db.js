// Thư viện Mongoose dùng để tương tác với cơ sở dữ liệu MongoDB
const mongoose = require('mongoose');

/**
 * Hàm bất đồng bộ dùng để kết nối với cơ sở dữ liệu MongoDB.
 * Lấy URI từ biến môi trường MONGO_URI, nếu không có sẽ dùng URI mặc định chạy local.
 */
const connectDB = async () => {
  try {
    // Thực hiện kết nối tới MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sdn302_pe_template');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // In ra lỗi và dừng ứng dụng (exit code 1) nếu kết nối thất bại
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
