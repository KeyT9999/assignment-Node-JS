// File: routes/theaterRoutes.js
// Chức năng: Định nghĩa các API endpoint liên quan đến các rạp chiếu phim (Theaters).

const express = require("express");
const router = express.Router();

// Nhập controller xử lý dữ liệu rạp chiếu
const theaterController = require("../controllers/theaterController");

// Các API Route liên kết với tiền tố "/theaters" trong server.js

// Lấy danh sách toàn bộ rạp chiếu phim: GET /theaters
router.get("/", theaterController.getAllTheaters);

// Tạo một rạp chiếu phim mới: POST /theaters
router.post("/", theaterController.createTheater);

module.exports = router;

