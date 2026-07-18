const express = require('express');
const router = express.Router();
const {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
}
 = require('../controllers/stationController');
const {
  protect
}
 = require('../middlewares/authMiddleware');
const {
  authorizeRoles
}
 = require('../middlewares/roleMiddleware');
// Public or Protected GET requests depending on strict exam specifications
// Usually GET is public, but let's make it open (optional protect middleware can be added here if needed)
router.get('/', getAllStations);
router.get('/:id', getStationById);
// Admin-only endpoints for station management
router.post('/', protect, authorizeRoles('admin'), createStation);
router.put('/:id', protect, authorizeRoles('admin'), updateStation);
router.delete('/:id', protect, authorizeRoles('admin'), deleteStation);
module.exports = router;
