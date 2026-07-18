const router = require('express').Router();
const controller = require('../controllers/shipmentController');
const auth = require('../middlewares/authMiddleware');
router.use(auth);
router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id/status', controller.updateStatus);
module.exports = router;
