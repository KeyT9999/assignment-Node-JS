const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getSessions, bookSession, cancelSession, extendSession } = require("../controllers/sessionController");

const router = express.Router();

router.get("/", protect, getSessions);
router.post("/book", protect, authorize("customer"), bookSession);
router.post("/cancel/:id", protect, authorize("customer"), cancelSession);
router.post("/extend/:id", protect, authorize("customer"), extendSession);

module.exports = router;