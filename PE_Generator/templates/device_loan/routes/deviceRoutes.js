const router = require('express').Router();
const controller = require('../controllers/deviceController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, controller.list);

module.exports = router;
