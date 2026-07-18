const express = require('express');
const router = express.Router();
const {
  getSessions,
  createSession
}
 = require('../controllers/sessionController');
const {
  protect
}
 = require('../middlewares/authMiddleware');
// Get sessions (Admin gets all, Customer gets only their own)
router.get('/', protect, getSessions);
// Create session (supported at POST /sessions and POST /sessions/book via alias)
router.post('/', protect, createSession);
router.post('/book', protect, createSession);
module.exports = router;
