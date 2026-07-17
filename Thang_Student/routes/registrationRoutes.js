const express = require('express');
const router = express.Router();
const {
  registerEvent,
  unregisterEvent,
  listRegistrations,
  getRegistrationsByDate
} = require('../controllers/registrationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Student endpoints
router.post('/registrations', protect, authorizeRoles('student'), registerEvent);
router.delete('/registrations/:registrationId', protect, authorizeRoles('student'), unregisterEvent);

// Admin endpoints
router.get('/listRegistrations', protect, authorizeRoles('admin'), listRegistrations);
router.get('/getRegistrationsByDate', protect, authorizeRoles('admin'), getRegistrationsByDate);

module.exports = router;
