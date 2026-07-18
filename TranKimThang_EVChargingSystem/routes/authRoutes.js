/**
 * @file authRoutes.js
 * @description Định nghĩa các endpoints đăng ký và đăng nhập của phân hệ Xác thực (Authentication).
 */

const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Đăng ký tài khoản mới: POST /auth/register
router.post('/register', register);

// Đăng nhập hệ thống: POST /auth/login
router.post('/login', login);

module.exports = router;

