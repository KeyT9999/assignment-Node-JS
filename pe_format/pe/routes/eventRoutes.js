// routes/eventRoutes.js
const express = require('express');
const { getEvents } = require('../controllers/eventController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getEvents);
module.exports = router;
