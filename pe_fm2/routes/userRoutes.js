const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Chỉ Admin mới có quyền truy cập các route này 
router.get('/', verifyToken, isAdmin, userCtrl.getAllUsers);
router.delete('/:id', verifyToken, isAdmin, userCtrl.deleteUser);

module.exports = router;