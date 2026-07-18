const express = require('express');
const router = express.Router();
const controller = require('../controllers/testCatalogueController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, controller.list);
router.post('/', protect, controller.create);
router.put('/:id', protect, controller.update);
router.delete('/:id', protect, controller.remove);

module.exports = router;
