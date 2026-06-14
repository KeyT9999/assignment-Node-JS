// File: src/server.js
// Chức năng: Khởi động Express Server, cấu hình middleware, thiết lập view engine Handlebars,
// và liên kết các file định tuyến (routes) để xử lý yêu cầu.

// Load các biến môi trường từ file .env vào process.env
require("dotenv").config();

// Import các thư viện lõi và bên thứ ba cần thiết
const express = require("express"); // Web framework cho Node.js
const cors = require("cors");       // Middleware cho phép chia sẻ tài nguyên nguồn chéo (CORS)
const connectDB = require("./config/db"); // Hàm kết nối MongoDB đã viết trong src/config/db.js

const path = require("path"); // Module lõi của Node.js dùng để xử lý đường dẫn thư mục/tập tin

// Import helper engine của express-handlebars để hỗ trợ render giao diện (template engine)
const { engine } = require("express-handlebars");

// Import các file định tuyến (routers) cho API
const quizRoutes = require("./routes/quizRoutes");
const questionRoutes = require("./routes/questionRoutes");

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối tới cơ sở dữ liệu MongoDB
connectDB();

// --- Cấu hình Giao diện (View Engine) ---
// Định nghĩa View Engine "handlebars" sử dụng thư viện express-handlebars
// Ở đây đặt defaultLayout: false vì các file handlebars (.handlebars) của dự án được viết độc lập, không dùng chung layout.html chính
app.engine("handlebars", engine({ defaultLayout: false }));
// Cấu hình thư mục chứa các file view là thư mục "views" bên trong thư mục hiện tại của server.js
app.set("views", path.join(__dirname, "views"));
// Thiết lập view engine mặc định cho Express là handlebars
app.set("view engine", "handlebars");

// --- Cấu hình các Middleware ---
app.use(cors()); // Cho phép các domain khác nhau gọi API tới ứng dụng này
app.use(express.json()); // Phân tích cú pháp dữ liệu JSON gửi lên từ client (req.body)
app.use(express.urlencoded({ extended: true })); // Phân tích dữ liệu từ form HTML (URL-encoded body)

// --- Định nghĩa các Route Render Trang Giao Diện (View Routes) ---
// Route trang chủ: hiển thị danh sách các bộ Quiz
app.get("/", (req, res) => {
  res.render("index"); // Render file src/views/index.handlebars
});

// Route chi tiết bộ Quiz: hiển thị các câu hỏi của bộ Quiz cụ thể
app.get("/pages/quizzes/:quizId", (req, res) => {
  // Render file src/views/quiz-detail.handlebars và truyền biến quizId sang giao diện để gọi API bằng JavaScript client-side
  res.render("quiz-detail", { quizId: req.params.quizId });
});

// Route ngân hàng câu hỏi: quản lý danh sách toàn bộ câu hỏi độc lập
app.get("/pages/questions", (req, res) => {
  res.render("questions"); // Render file src/views/questions.handlebars
});

// --- Định nghĩa các Route API (API Routes) ---
app.use("/quizzes", quizRoutes);     // Gắn các API xử lý Quiz vào tiền tố đường dẫn /quizzes
app.use("/question", questionRoutes); // Gắn các API xử lý Question vào tiền tố đường dẫn /question

// --- Xử lý lỗi 404 (Không tìm thấy Route phù hợp) ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found", // Phản hồi lỗi 404 dạng JSON
  });
});

// Thiết lập cổng chạy server: ưu tiên lấy từ biến môi trường PORT, mặc định là 9999
const PORT = process.env.PORT || 9999;

// Khởi chạy server và lắng nghe các yêu cầu trên PORT đã cấu hình
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
