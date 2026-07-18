/**
 * @file db.js
 * @description Thiết lập kết nối cơ sở dữ liệu MongoDB bằng Mongoose cho hệ thống EV Charging System.
 */

const mongoose = require('mongoose');

/**
 * Hàm thực hiện kết nối tới MongoDB.
 * Lấy URI từ biến môi trường MONGO_URI, hoặc fallback về localhost.
 * 
 * @async
 * @function connectDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eVChargingSystem');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }  catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Thoát tiến trình nếu kết nối thất bại
  }
};

module.exports = connectDB;

