const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getSessions, bookSession, cancelSession, extendSession, getOverdueSessions, cancelSessionsInTimeRange } = require("../controllers/sessionController");

const router = express.Router();

router.get("/", protect, getSessions);
router.get("/overdue", protect, authorize("admin"), getOverdueSessions);
router.post("/book", protect, authorize("customer"), bookSession);
router.post("/cancel/:id", protect, authorize("customer"), cancelSession);
router.post("/extend/:id", protect, authorize("customer"), extendSession);
router.post("/cancel-range", protect, authorize("admin"), cancelSessionsInTimeRange);

module.exports = router;