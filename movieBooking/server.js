// File: server.js (Dự án đặt vé xem phim - MovieBooking)
// Chức năng: Khởi chạy Express Server, kết nối cơ sở dữ liệu MongoDB, seeding dữ liệu mẫu ban đầu,
// thiết lập EJS làm template engine để hiển thị giao diện và đăng ký các routes API.

// Nạp các biến môi trường từ tệp .env (ví dụ: MONGO_URI, PORT)
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Nhập hàm seedDatabase để khởi tạo dữ liệu mẫu (rạp phim, lịch chiếu) nếu DB trống
const seedDatabase = require("./config/dbSeeder");

// Nhập các route router xử lý các API endpoint tương ứng
const bookingRoutes = require("./routes/bookingRoutes");
const theaterRoutes = require("./routes/theaterRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

// Tạo ứng dụng Express
const app = express();

// Sử dụng Middleware CORS để cho phép gọi API từ các nguồn khác nhau
app.use(cors());

// Middleware để phân tích dữ liệu JSON gửi lên trong body của HTTP request
app.use(express.json());

// Middleware để phân tích dữ liệu từ form URL-encoded (ví dụ: form HTML truyền thống)
app.use(express.urlencoded({ extended: true }));

// Thiết lập thư mục chứa các tệp giao diện EJS (thư mục views)
app.set("views", path.join(__dirname, "views"));
// Cấu hình Express sử dụng EJS làm Template Engine để render HTML
app.set("view engine", "ejs");

// Kết nối tới cơ sở dữ liệu MongoDB bằng chuỗi kết nối lưu trong file .env (MONGO_URI)
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected successfully!");
    // Sau khi kết nối thành công, tiến hành seed dữ liệu mẫu nếu DB chưa có
    await seedDatabase();
  })
  .catch((error) => console.log("Lỗi kết nối cơ sở dữ liệu:", error));

// Route hiển thị trang chủ: render tệp views/index.ejs (Giao diện lịch chiếu phim)
app.get("/", (req, res) => {
  res.render("index");
});

// Route hiển thị trang danh sách đặt vé: render tệp views/bookings.ejs
app.get("/page/bookings", (req, res) => {
  res.render("bookings");
});

// Đăng ký các API Routes với tiền tố tương ứng
app.use("/bookings", bookingRoutes);   // Route xử lý đặt vé, sửa vé, hủy vé và lấy lịch sử đặt vé
app.use("/theaters", theaterRoutes);   // Route xử lý lấy thông tin các rạp chiếu phim
app.use("/schedules", scheduleRoutes); // Route xử lý lấy thông tin lịch chiếu các bộ phim

// Xác định cổng (port) hoạt động của Server, mặc định là 3000 nếu không thiết lập trong .env
const PORT = process.env.PORT || 3000;

// Khởi chạy server lắng nghe các kết nối gửi tới cổng đã cấu hình
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});