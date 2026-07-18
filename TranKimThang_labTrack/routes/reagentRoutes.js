const express = require('express');
const router = express.Router();
const controller = require('../controllers/reagentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/reagents', protect, controller.createReagent);
router.post('/reagents/restock', protect, controller.restock);
router.get('/reagents', protect, controller.list);

module.exports = router;
