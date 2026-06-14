// File: server.js (Dự án thuê xe ô tô - CarRental)
// Chức năng: Khởi chạy Express Server, thiết lập kết nối MongoDB qua db.js,
// cấu hình EJS view engine để hiển thị danh sách xe, đặt xe và quản lý routes.

// Nạp các cấu hình từ file .env vào biến môi trường process.env
require("dotenv").config();

// Import các thư viện cần thiết
const express = require("express"); // Web Framework cho Node.js
const cors = require("cors");       // Middleware xử lý chính sách CORS
const path = require("path");       // Module lõi xử lý đường dẫn tệp tin

// Import hàm kết nối database và các file định tuyến
const connectDB = require("./config/db");
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// Khởi tạo đối tượng ứng dụng Express
const app = express();

// Thực hiện kết nối tới database MongoDB
connectDB();

// --- Cấu hình Middleware ---
app.use(cors()); // Cho phép gọi API xuyên nguồn
app.use(express.json()); // Phân tích JSON body
app.use(express.urlencoded({ extended: true })); // Phân tích URL-encoded body (ví dụ từ form HTML gửi lên)

// --- Cấu hình View Engine (EJS) ---
// Thiết lập thư mục chứa các file EJS là thư mục "views" cùng cấp
app.set("views", path.join(__dirname, "views"));
// Cấu hình view engine cho Express là EJS (Embedded JavaScript templates)
app.set("view engine", "ejs");

// --- Định nghĩa các Route Giao Diện (View Routes) ---
// Trang chủ (Trang chính giới thiệu dịch vụ thuê xe)
app.get("/", (req, res) => {
  res.render("index"); // Render file views/index.ejs
});

// Trang danh sách xe & quản lý xe
app.get("/page/cars", (req, res) => {
  res.render("cars"); // Render file views/cars.ejs
});

// Trang đặt thuê xe & quản lý đơn booking
app.get("/page/bookings", (req, res) => {
  res.render("bookings"); // Render file views/bookings.ejs
});

// --- Định nghĩa các Route API ---
app.use("/cars", carRoutes);       // Các API liên quan đến Xe (CRUD)
app.use("/bookings", bookingRoutes); // Các API liên quan đến đơn Đặt Xe (đặt xe, sửa lịch, hủy lịch)

// Cấu hình Port chạy ứng dụng (Mặc định là 3000 nếu không thiết lập trong .env)
const PORT = process.env.PORT || 3000;

// Khởi chạy server và lắng nghe trên PORT
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
