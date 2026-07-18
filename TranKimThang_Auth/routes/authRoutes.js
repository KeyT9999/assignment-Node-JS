const router = require('express').Router();
const controller = require('../controllers/authController');
const authConfig = require('../config/authConfig');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

if (authConfig.registrationMode === 'manager_only') {
  router.post('/register', verifyToken, requireRole(...authConfig.managerRoles), controller.register);
} else {
  router.post('/register', controller.register);
}

router.post('/login', controller.login);
router.get('/me', verifyToken, controller.me);

module.exports = router;
