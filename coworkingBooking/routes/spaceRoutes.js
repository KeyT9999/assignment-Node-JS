const express = require('express');
const router = express.Router();
// Nhập các controller xử lý logic liên quan đến không gian làm việc (Spaces)
const {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
} = require('../controllers/spaceController');

// Nhập các middleware xác thực JWT và phân quyền
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Route lấy danh sách tất cả các không gian: GET /spaces (Công khai - Public)
router.get('/', getAllSpaces);

// Route lấy thông tin chi tiết một không gian: GET /spaces/:id (Công khai - Public)
router.get('/:id', getSpaceById);

// Route tạo mới không gian: POST /spaces (Yêu cầu đăng nhập và chỉ cho phép tài khoản Admin)
router.post('/', protect, authorizeRoles('admin'), createSpace);

// Route cập nhật không gian: PUT /spaces/:id (Yêu cầu đăng nhập và chỉ cho phép tài khoản Admin)
router.put('/:id', protect, authorizeRoles('admin'), updateSpace);

// Route xóa không gian: DELETE /spaces/:id (Yêu cầu đăng nhập và chỉ cho phép tài khoản Admin)
router.delete('/:id', protect, authorizeRoles('admin'), deleteSpace);

module.exports = router;
