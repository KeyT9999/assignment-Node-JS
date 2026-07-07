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

// Public or Protected GET requests depending on strict exam specifications
// Usually GET is public, but let's make it open (optional protect middleware can be added here if needed)
router.get('/', getAllSpaces);
router.get('/:id', getSpaceById);

// Admin-only endpoints for resource management
router.post('/', protect, authorizeRoles('admin'), createSpace);
router.put('/:id', protect, authorizeRoles('admin'), updateSpace);
router.delete('/:id', protect, authorizeRoles('admin'), deleteSpace);

module.exports = router;
