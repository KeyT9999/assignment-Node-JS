// File: routes/bookingRoutes.js
// Chức năng: Định nghĩa các endpoints API cho việc đặt thuê xe và hủy lịch trình.

// Import express và khởi tạo Router
const express = require("express");
const router = express.Router();

// Import các Controller xử lý logic nghiệp vụ cho booking (thuê xe)
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
} = require("../controllers/bookingController");

// Định nghĩa các route cho tài nguyên "/bookings" (sử dụng tiền tố này khi import ở server.js)

// Route: "/" (tương ứng GET/POST tới "/bookings")
router.route("/")
  .get(getAllBookings)   // GET: Lấy danh sách toàn bộ các lịch sử đơn đặt xe
  .post(createBooking);  // POST: Tạo mới một đơn thuê xe (có kiểm tra lịch trùng)

// Route: "/:bookingId" (tương ứng GET/PUT/DELETE tới "/bookings/:bookingId")
router.route("/:bookingId")
  .get(getBookingById)   // GET: Xem chi tiết một đơn đặt xe theo ID (MongoDB ObjectId)
  .put(updateBooking)    // PUT: Chỉnh sửa thông tin đơn đặt xe (cập nhật lại thời gian, biển số xe)
  .delete(deleteBooking); // DELETE: Xóa đơn đặt xe khỏi hệ thống (đồng thời cập nhật lại trạng thái xe nếu cần)

// Route: "/:bookingId/cancel" (Hủy đơn đặt xe)
router.route("/:bookingId/cancel")
  .post(cancelBooking);

// Export router để sử dụng trong server.js
module.exports = router;
