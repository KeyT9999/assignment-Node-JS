/**
 * @file authRoutes.js
 * @description Định nghĩa các API endpoints cho phân hệ Xác thực (Authentication).
 * Bao gồm đăng ký, đăng nhập và lấy thông tin cá nhân.
 * Cấu hình động dựa trên chế độ đăng ký (công khai hoặc giới hạn chỉ Quản lý mới được tạo tài khoản).
 */

const router = require('express').Router();
const controller = require('../controllers/authController');
const authConfig = require('../config/authConfig');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

/**
 * Route Đăng ký tài khoản mới (/auth/register).
 * 
 * Logic nghiệp vụ đặc biệt:
 * - Nếu `registrationMode` là 'manager_only': Chỉ những tài khoản đã đăng nhập
 *   và có vai trò quản lý (managerRoles) mới được quyền đăng ký tài khoản mới.
 * - Ngược lại ('public'): Cho phép đăng ký tự do không cần token xác thực.
 */
if (authConfig.registrationMode === 'manager_only') {
  router.post('/register', verifyToken, requireRole(...authConfig.managerRoles), controller.register);
} else {
  router.post('/register', controller.register);
}

/**
 * Route Đăng nhập hệ thống (/auth/login).
 * Nhận vào username và password, trả về JWT Token nếu thành công.
 */
router.post('/login', controller.login);

/**
 * Route Lấy thông tin tài khoản hiện tại (/auth/me).
 * Yêu cầu xác thực token hợp lệ thông qua middleware verifyToken.
 */
router.get('/me', verifyToken, controller.me);

module.exports = router;

