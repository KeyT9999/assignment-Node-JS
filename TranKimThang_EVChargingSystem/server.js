/**
 * @file server.js
 * @description Điểm khởi chạy chính (Entry Point) của ứng dụng trạm sạc xe điện EV Charging System.
 * Nạp cấu hình, kết nối DB, đăng ký các API routes, và thiết lập xử lý lỗi toàn cục.
 */

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Nạp các biến môi trường từ tập tin .env
dotenv.config();

// Khởi tạo ứng dụng express
const app = express();

// Sử dụng middleware để phân tích dữ liệu JSON gửi lên từ Client
app.use(express.json());

// Thực hiện kết nối cơ sở dữ liệu MongoDB
connectDB();

// Đăng ký các tập tin định tuyến (Routes)
const authRoutes = require('./routes/authRoutes');
const stationRoutes = require('./routes/stationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// Định tuyến URL cho các phân hệ
app.use('/auth', authRoutes);
app.use('/stations', stationRoutes);
app.use('/sessions', sessionRoutes);

// Route mặc định (Root path) hiển thị trạng thái hoạt động của hệ thống
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the SDN302 PE - TranKimThang_EVChargingSystem API!',
    status: 'Running',
    pricingMode: process.env.PRICING_MODE || 'NORMAL',
    enableHappyHour: process.env.ENABLE_HAPPY_HOUR || 'false',
    enableWallet: process.env.ENABLE_WALLET || 'false'
  });
});

// Middleware xử lý lỗi 404 Not Found (Khi client truy cập sai URL)
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route not found - ${req.originalUrl}`
  });
});

// Middleware xử lý lỗi hệ thống toàn cục (Global Error Handler)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Thiết lập cổng mạng lắng nghe kết nối (mặc định là 9999)
const PORT = process.env.PORT || 9999;

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`- API URL: http://localhost:${PORT}`);
});

