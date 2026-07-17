const router = require('express').Router(); const c = require('../controllers/bookingController');
router.get('/', c.getBookings); router.post('/', c.createBooking); router.put('/:bookingId', c.updateBooking); router.delete('/:bookingId', c.deleteBooking); module.exports = router;
