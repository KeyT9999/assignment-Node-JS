const express = require('express');
const router = express.Router();
const { getReservations, createReservation } = require('../controllers/reservationController');
const { protect } = require('../middlewares/authMiddleware');

// Get reservations (Admin gets all, Customer gets only their own)
router.get('/', protect, getReservations);

// Create reservation (supported at POST /reservations and POST /reservations/book via alias)
router.post('/', protect, createReservation);
router.post('/book', protect, createReservation);

module.exports = router;
