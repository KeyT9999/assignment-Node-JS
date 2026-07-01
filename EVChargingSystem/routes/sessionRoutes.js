const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getSessions, bookSession, cancelSession } = require("../controllers/sessionController");

const router = express.Router();

router.get("/", protect, getSessions);
router.post("/book", protect, authorize("customer"), bookSession);
router.post("/cancel/:id", protect, authorize("customer"), cancelSession);

module.exports = router;