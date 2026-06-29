const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  createStation,
  getStations,
  getAvailableStations,
  getStationById,
  updateStation,
  deleteStation
} = require("../controllers/stationController");

const router = express.Router();

router.post("/", protect, authorize("admin"), createStation);
router.get("/", protect, getStations);
router.get("/available", protect, getAvailableStations);
router.get("/:id", protect, getStationById);
router.put("/:id", protect, authorize("admin"), updateStation);
router.delete("/:id", protect, authorize("admin"), deleteStation);

module.exports = router;