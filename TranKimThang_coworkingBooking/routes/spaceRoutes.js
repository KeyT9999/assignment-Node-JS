const express = require('express');
const router = express.Router();
const {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
} = require('../controllers/spaceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/', getAllSpaces);
router.get('/:id', getSpaceById);

router.post('/', protect, authorizeRoles('admin'), createSpace);
router.put('/:id', protect, authorizeRoles('admin'), updateSpace);
router.delete('/:id', protect, authorizeRoles('admin'), deleteSpace);

module.exports = router;
