const router = require('express').Router();
const c = require('../controllers/rentalController');
const {
  protect
}
 = require('../middlewares/authMiddleware');
const {
  authorizeRoles
}
 = require('../middlewares/roleMiddleware');
router.use(protect);
router.get('/', c.getRentals);
router.post('/', authorizeRoles('admin', 'customer'), c.createRental);
router.patch('/:id/return', authorizeRoles('admin'), c.returnRental);
module.exports = router;
