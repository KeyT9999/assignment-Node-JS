const router = require('express').Router();
const controller = require('../controllers/loanController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, controller.create);
router.patch('/:id/return', protect, controller.returnLoan);
router.get('/', protect, controller.list);

module.exports = router;
