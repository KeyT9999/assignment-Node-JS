const express = require("express");
// Import các hàm xử lý từ authController
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Tuyến đường POST /auth/register - Cho phép đăng ký tài khoản mới (Public access)
router.post("/register", register);

// Tuyến đường POST /auth/login - Cho phép người dùng đăng nhập để nhận mã truy cập JWT (Public access)
router.post("/login", login);

module.exports = router;