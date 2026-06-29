const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getSessions, bookSession } = require("../controllers/sessionController");

const router = express.Router();

router.get("/", protect, getSessions);
router.post("/book", protect, authorize("customer"), bookSession);

module.exports = router;