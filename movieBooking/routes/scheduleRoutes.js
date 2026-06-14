// File: routes/scheduleRoutes.js
// Chức năng: Định nghĩa các API endpoint truy xuất và tạo lịch chiếu phim (Schedules).

const express = require("express");
const router = express.Router();

// Nhập controller xử lý logic lịch chiếu
const scheduleController = require("../controllers/scheduleController");

// Các API Route liên kết với tiền tố "/schedules" trong server.js

// Lấy danh sách lịch chiếu phim đang mở: GET /schedules
router.get("/", scheduleController.getAllSchedules);

// Tạo một lịch chiếu phim mới: POST /schedules
router.post("/", scheduleController.createSchedule);

// Thêm import hàm mới hoặc giữ nguyên require cả object như hiện tại:
// const scheduleController = require("../controllers/scheduleController");

// Đăng ký route GET /schedules/search trước các route có param động (nếu có) để tránh xung đột
router.get("/search", scheduleController.getMoviesByTheaterAndShowtime);


module.exports = router;

