const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/sample-turnaround', protect, controller.sampleTurnaround);
router.get('/reagent-usage', protect, controller.reagentUsage);

module.exports = router;
