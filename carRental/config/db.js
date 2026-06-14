// File: config/db.js
// Chức năng: Cấu hình và thiết lập kết nối tới cơ sở dữ liệu MongoDB.

// Import thư viện mongoose để kết nối và tương tác với MongoDB
const mongoose = require("mongoose");

/**
 * Hàm bất đồng bộ connectDB thực hiện kết nối tới database.
 * Sử dụng khối try/catch để bắt các lỗi kết nối nếu có.
 */
const connectDB = async () => {
  try {
    // Gọi hàm connect của mongoose, lấy URI từ file .env qua biến MONGO_URI
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // In ra màn hình console khi kết nối thành công kèm theo tên host của cơ sở dữ liệu
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // In ra màn hình console nếu kết nối thất bại
    console.error(`Lỗi kết nối MongoDB: ${error.message}`);
    
    // Thoát ứng dụng ngay lập tức với mã trạng thái thất bại (1)
    process.exit(1);
  }
};

// Export hàm connectDB để sử dụng bên file server.js
module.exports = connectDB;
