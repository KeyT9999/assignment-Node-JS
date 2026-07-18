const router = require('express').Router();
const authConfig = require('../config/authConfig');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/authenticated', verifyToken, (req, res) => {
  res.json({ message: 'Authenticated', user: req.user });
});

router.get('/manager', verifyToken, requireRole(...authConfig.managerRoles), (_req, res) => {
  res.json({ message: 'Manager access granted' });
});

module.exports = router;
