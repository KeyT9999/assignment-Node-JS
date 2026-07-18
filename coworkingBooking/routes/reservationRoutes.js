const express = require('express');
const router = express.Router();
// Nhập các controller xử lý đơn đặt chỗ (Reservations)
const { getReservations, createReservation } = require('../controllers/reservationController');
// Nhập middleware bảo vệ xác thực người dùng đăng nhập
const { protect } = require('../middlewares/authMiddleware');

// Route lấy danh sách đơn đặt chỗ: GET /reservations (Yêu cầu đăng nhập)
router.get('/', protect, getReservations);

// Route tạo mới đơn đặt chỗ: POST /reservations và POST /reservations/book (Cả hai đều yêu cầu đăng nhập)
router.post('/', protect, createReservation);
router.post('/book', protect, createReservation);

module.exports = router;
