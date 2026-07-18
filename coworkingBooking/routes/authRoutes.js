const express = require('express');
const router = express.Router();
// Nhập các controller xử lý chức năng đăng ký, đăng nhập
const { register, login } = require('../controllers/authController');

// Route Đăng ký tài khoản: POST /auth/register
router.post('/register', register);

// Route Đăng nhập hệ thống: POST /auth/login
router.post('/login', login);

module.exports = router;
