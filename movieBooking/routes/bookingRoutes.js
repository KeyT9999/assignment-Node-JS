// File: routes/bookingRoutes.js
// Chức năng: Định nghĩa các API endpoint xử lý đơn đặt vé (lấy danh sách, tạo mới, cập nhật, hủy bỏ vé).

const express = require('express');
const router = express.Router();

// Nhập controller xử lý logic đặt vé
const bookingController = require('../controllers/bookingController');

// Định nghĩa các Route tương ứng với các phương thức HTTP
// Đầu Router này được gắn với tiền tố "/bookings" trong server.js

// Lấy danh sách toàn bộ các vé đã đặt: GET /bookings
router.get('/', bookingController.getAllBookings);

// Tạo mới một đơn đặt vé xem phim: POST /bookings
router.post('/', bookingController.createBooking);

// Cập nhật/thay đổi số vé đã đặt: PUT /bookings/:bookingId
router.put('/:bookingId', bookingController.updateBooking);

// Hủy đơn đặt vé xem phim: DELETE /bookings/:bookingId
router.delete('/:bookingId', bookingController.deleteBooking);

module.exports = router;