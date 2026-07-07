const express = require('express');
const router = express.Router();
const { getBookings, createBooking } = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// Get bookings (Admin gets all, Customer gets only their own)
router.get('/', protect, getBookings);

// Create booking (supported at POST /bookings and POST /bookings/book via alias)
router.post('/', protect, createBooking);
router.post('/book', protect, createBooking);

module.exports = router;
