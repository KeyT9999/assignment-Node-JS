// routes/registrationRoutes.js
const express = require('express');
const {
  registerEvent,
  unregisterEvent,
  listRegistrations,
  searchByDate
} = require('../controllers/registrationController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', verifyToken, authorizeRoles('student'), registerEvent);
router.delete('/:registrationId', verifyToken, authorizeRoles('student'), unregisterEvent);
router.get('/listRegistrations', verifyToken, authorizeRoles('admin'), listRegistrations);
router.get('/getRegistrationsByDate', verifyToken, authorizeRoles('admin'), searchByDate);
module.exports = router;