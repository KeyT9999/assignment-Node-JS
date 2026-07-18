// Thư viện Express để xây dựng ứng dụng web/API
const express = require('express');
// Thư viện dotenv để quản lý các biến môi trường từ tệp .env
const dotenv = require('dotenv');
// Nhập hàm kết nối cơ sở dữ liệu MongoDB
const connectDB = require('./config/db');

// Nạp cấu hình biến môi trường từ file .env
dotenv.config();

// Khởi tạo đối tượng Express App
const app = express();

// Middleware tích hợp sẵn của Express để phân tích cú pháp dữ liệu JSON từ body request
app.use(express.json());

// Thực thi kết nối tới cơ sở dữ liệu MongoDB
connectDB();

// Nhập các tệp định tuyến (routes) của từng tài nguyên
const authRoutes = require('./routes/authRoutes');
const spaceRoutes = require('./routes/spaceRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

// Cấu hình các tiền tố endpoint cho các router tương ứng
app.use('/auth', authRoutes);
app.use('/spaces', spaceRoutes);
app.use('/reservations', reservationRoutes);

// Endpoint chẩn đoán ở thư mục gốc: GET /
// Trả về trạng thái hoạt động của Server và các cấu hình hệ thống hiện tại
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the SDN302 Practical Exam Generic Template API!',
    status: 'Running',
    pricingMode: process.env.PRICING_MODE || 'NORMAL',
    enableHappyHour: process.env.ENABLE_HAPPY_HOUR || 'false',
    enableWallet: process.env.ENABLE_WALLET || 'false'
  });
});

// Middleware xử lý trường hợp không tìm thấy đường dẫn (Route 404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Middleware xử lý lỗi toàn cục (Global Error Handler)
// Nó sẽ bắt tất cả lỗi không được xử lý (unhandled errors) trong các controller/middleware khác
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// Đọc giá trị cổng PORT từ biến môi trường, mặc định là 9999 nếu chưa cấu hình
const PORT = process.env.PORT || 9999;

// Khởi động server lắng nghe các kết nối tới cổng đã cấu hình
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`- API URL: http://localhost:${PORT}`);
});
