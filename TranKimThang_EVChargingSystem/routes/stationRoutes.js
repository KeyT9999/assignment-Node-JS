/**
 * @file stationRoutes.js
 * @description Định nghĩa các endpoints quản lý trạm sạc xe điện (Stations).
 * Các phương thức xem thông tin (GET) được mở công khai, các phương thức chỉnh sửa (POST, PUT, DELETE) chỉ dành cho Admin.
 */

const express = require('express');
const router = express.Router();
const {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
} = require('../controllers/stationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Lấy danh sách tất cả các trạm sạc: GET /stations
router.get('/', getAllStations);

// Lấy thông tin chi tiết một trạm sạc: GET /stations/:id
router.get('/:id', getStationById);

// Tạo mới một trạm sạc (Yêu cầu đăng nhập & quyền admin): POST /stations
router.post('/', protect, authorizeRoles('admin'), createStation);

// Cập nhật thông tin trạm sạc (Yêu cầu đăng nhập & quyền admin): PUT /stations/:id
router.put('/:id', protect, authorizeRoles('admin'), updateStation);

// Xóa một trạm sạc (Yêu cầu đăng nhập & quyền admin): DELETE /stations/:id
router.delete('/:id', protect, authorizeRoles('admin'), deleteStation);

module.exports = router;

