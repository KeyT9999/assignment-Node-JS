const router = require('express').Router();
const c = require('../controllers/equipmentController');
const {
  protect
}
 = require('../middlewares/authMiddleware');
const {
  authorizeRoles
}
 = require('../middlewares/roleMiddleware');
router.get('/', c.getEquipment);
router.post('/', protect, authorizeRoles('admin'), c.createEquipment);
module.exports = router;
