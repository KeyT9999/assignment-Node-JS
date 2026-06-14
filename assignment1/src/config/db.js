// File: src/config/db.js
// Chức năng: Thiết lập kết nối tới cơ sở dữ liệu MongoDB sử dụng mongoose.

// Import thư viện mongoose để tương tác với cơ sở dữ liệu MongoDB
const mongoose = require("mongoose");

/**
 * Hàm không đồng bộ (async function) dùng để kết nối tới cơ sở dữ liệu MongoDB.
 * Sử dụng từ khóa async/await để xử lý các tác vụ bất đồng bộ một cách trực quan hơn.
 */
const connectDB = async () => {
  try {
    // Gọi phương thức connect của mongoose, truyền vào URI của database lấy từ biến môi trường MONGO_URI
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // In ra màn hình console khi kết nối thành công cùng với địa chỉ host của database
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // Nếu xảy ra lỗi trong quá trình kết nối, in lỗi ra màn hình console
    console.error("MongoDB connection error:", error.message);
    
    // Thoát ứng dụng với mã trạng thái thất bại (1) nếu không thể kết nối tới cơ sở dữ liệu
    process.exit(1);
  }
};

// Xuất hàm connectDB để có thể import và sử dụng ở file server.js (khởi chạy server)
module.exports = connectDB;
