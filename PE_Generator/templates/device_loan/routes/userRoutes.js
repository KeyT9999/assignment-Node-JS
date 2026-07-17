const router = require('express').Router();
const controller = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', protect, authorizeRoles('admin'), controller.list);
router.delete('/:id', protect, authorizeRoles('admin'), controller.remove);

module.exports = router;
