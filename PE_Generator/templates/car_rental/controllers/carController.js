const Car = require('../models/carModel');
exports.getCars = async (_req, res) => res.json(await Car.find());
exports.createCar = async (req, res) => { try { return res.status(201).json(await Car.create(req.body)); } catch (error) { return res.status(400).json({ message: error.message }); } };
exports.updateCar = async (req, res) => { try { const car = await Car.findByIdAndUpdate(req.params.carId, req.body, { new: true, runValidators: true }); return car ? res.json(car) : res.status(404).json({ message: 'Car not found' }); } catch (error) { return res.status(400).json({ message: error.message }); } };
exports.deleteCar = async (req, res) => { const car = await Car.findByIdAndDelete(req.params.carId); return car ? res.json({ message: 'Car deleted' }) : res.status(404).json({ message: 'Car not found' }); };
