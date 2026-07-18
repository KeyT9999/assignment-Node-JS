const express = require('express');
const router = express.Router();
const controller = require('../controllers/sampleController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/samples', protect, controller.list);
router.post('/samples', protect, controller.create);
router.post('/samples/:id/start-test', protect, controller.startTest);
router.patch('/samples/:id/complete', protect, controller.complete);

module.exports = router;
