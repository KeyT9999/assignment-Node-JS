// File: routes/carRoutes.js
// Chức năng: Định nghĩa các endpoints API để lấy thông tin xe và thêm xe.

// Import express và khởi tạo Router
const express = require("express");
const router = express.Router();

// Import các Controller xử lý logic nghiệp vụ cho xe
const {
  getAllCars,
  getCarByNumber,
  createCar,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

// Định nghĩa các route cho tài nguyên "/cars" (sử dụng tiền tố này khi import ở server.js)

// Route: "/" (tương ứng GET/POST tới "/cars")
router.route("/")
  .get(getAllCars)   // GET: Lấy danh sách toàn bộ các xe trong hệ thống
  .post(createCar);  // POST: Thêm mới một chiếc xe vào hệ thống CSDL

// Route: "/:carNumber" (tương ứng GET/PUT/DELETE tới "/cars/:carNumber")
router.route("/:carNumber")
  .get(getCarByNumber) // GET: Lấy thông tin chi tiết của 1 chiếc xe theo biển số xe
  .put(updateCar)      // PUT: Cập nhật thông tin xe theo biển số xe
  .delete(deleteCar);  // DELETE: Xóa xe khỏi hệ thống theo biển số xe

// Export router để sử dụng trong server.js
module.exports = router;
