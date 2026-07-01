// Nạp cấu hình các biến môi trường từ file .env vào process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
// Import hàm kết nối cơ sở dữ liệu MongoDB
const connectDB = require("./config/db");

// Import các file định tuyến (routes) cho từng phân hệ nghiệp vụ
const authRoutes = require("./routes/authRoutes");
const stationRoutes = require("./routes/stationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

// Khởi tạo đối tượng ứng dụng Express
const app = express();

// Thực hiện kết nối tới cơ sở dữ liệu MongoDB và khởi tạo dữ liệu mẫu
connectDB();

// Cấu hình Middleware
// Cho phép chia sẻ tài nguyên giữa các nguồn khác nhau (Cross-Origin Resource Sharing)
app.use(cors());
// Hỗ trợ phân tích dữ liệu dạng JSON được gửi lên từ phía Client trong body request
app.use(express.json());

/**
 * @route   GET /health
 * @desc    API kiểm tra trạng thái hoạt động của hệ thống (Health Check)
 * @access  Public
 */
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "EV Charging System API is running"
    });
});

// Đăng ký các tuyến đường API với tiền tố tương ứng
app.use("/auth", authRoutes);       // Các API liên quan đến xác thực và tài khoản (đăng ký, đăng nhập)
app.use("/stations", stationRoutes); // Các API quản lý và tra cứu thông tin trạm sạc
app.use("/sessions", sessionRoutes); // Các API liên quan đến đặt lịch và quản lý phiên sạc

// Middleware xử lý khi Client truy cập vào một tuyến đường không tồn tại (404 Not Found)
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

// Thiết lập cổng chạy server (lấy từ biến môi trường PORT hoặc mặc định là 9999)
const PORT = process.env.PORT || 9999;

// Khởi động server lắng nghe các yêu cầu từ Client
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});