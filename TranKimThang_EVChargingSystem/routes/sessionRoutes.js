/**
 * @file sessionRoutes.js
 * @description Định nghĩa các endpoints quản lý phiên sạc (Sessions).
 * Tất cả các endpoints đều được bảo vệ bởi middleware `protect` (yêu cầu đăng nhập).
 */

const express = require('express');
const router = express.Router();
const { getSessions, createSession } = require('../controllers/sessionController');
const { protect } = require('../middlewares/authMiddleware');

// Lấy danh sách các phiên sạc (Khách hàng xem phiên sạc của mình, Admin xem tất cả): GET /sessions
router.get('/', protect, getSessions);

// Đăng ký phiên sạc mới (Hỗ trợ 2 bí danh POST /sessions và POST /sessions/book):
router.post('/', protect, createSession);
router.post('/book', protect, createSession);

module.exports = router;

