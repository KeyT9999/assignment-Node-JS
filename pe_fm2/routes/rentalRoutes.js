const express = require('express');
const router = express.Router();
const rentalCtrl = require('../controllers/rentalController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/', verifyToken, rentalCtrl.createRental);
router.patch('/:id/return', verifyToken, rentalCtrl.returnEquipment);
router.get('/', verifyToken, rentalCtrl.getRentals);

module.exports = router;