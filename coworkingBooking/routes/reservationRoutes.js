const express = require('express');
const router = express.Router();
const { getReservations, createReservation } = require('../controllers/reservationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getReservations);

router.post('/', protect, createReservation);
router.post('/book', protect, createReservation);

module.exports = router;
