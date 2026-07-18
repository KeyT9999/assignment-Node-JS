const router = require('express').Router();
const c = require('../controllers/carController');
router.get('/', c.getCars);
router.post('/', c.createCar);
router.put('/:carId', c.updateCar);
router.delete('/:carId', c.deleteCar);
module.exports = router;
