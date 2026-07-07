const express = require('express');
const router = express.Router();
const {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Public or Protected GET requests depending on strict exam specifications
// Usually GET is public, but let's make it open (optional protect middleware can be added here if needed)
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Admin-only endpoints for resource management
router.post('/', protect, authorizeRoles('admin'), createResource);
router.put('/:id', protect, authorizeRoles('admin'), updateResource);
router.delete('/:id', protect, authorizeRoles('admin'), deleteResource);

module.exports = router;
