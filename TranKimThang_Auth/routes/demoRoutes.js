/**
 * @file demoRoutes.js
 * @description Định nghĩa các API endpoints thử nghiệm (Demo) nhằm mục đích kiểm tra
 * hoạt động của các middleware xác thực và phân quyền trong hệ thống.
 */

const router = require('express').Router();
const authConfig = require('../config/authConfig');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * API Demo yêu cầu đã Đăng nhập (/demo/authenticated).
 * Mọi tài khoản có JWT token hợp lệ đều có thể truy cập được.
 * Trả về thông tin cơ bản của token đã được giải mã từ `req.user`.
 */
router.get('/authenticated', verifyToken, (req, res) => {
  res.json({ message: 'Authenticated', user: req.user });
});

/**
 * API Demo yêu cầu quyền Quản lý (/demo/manager).
 * Chỉ các tài khoản có vai trò thuộc nhóm Quản lý (managerRoles, ví dụ: 'admin') mới có quyền truy cập.
 * Các tài khoản bình thường khác sẽ nhận về lỗi 403 Forbidden.
 */
router.get('/manager', verifyToken, requireRole(...authConfig.managerRoles), (_req, res) => {
  res.json({ message: 'Manager access granted' });
});

module.exports = router;

