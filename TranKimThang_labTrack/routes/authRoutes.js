const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', protect, controller.register);
router.post('/login', controller.login);

module.exports = router;
