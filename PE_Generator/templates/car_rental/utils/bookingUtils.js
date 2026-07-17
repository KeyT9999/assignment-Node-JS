const Booking = require('../models/bookingModel');
const Car = require('../models/carModel');
const DAY_MS = 1000 * 60 * 60 * 24;

const validateAndPrice = async ({ carNumber, startDate, endDate, excludeBookingId }) => {
  const start = new Date(startDate); const end = new Date(endDate);
  if (!carNumber || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) { const error = new Error('startDate must be earlier than endDate'); error.status = 400; throw error; }
  const car = await Car.findOne({ carNumber });
  if (!car) { const error = new Error('Car not found'); error.status = 404; throw error; }
  if (car.status === 'maintenance') { const error = new Error('Car is under maintenance'); error.status = 400; throw error; }
  const overlapFilter = { carNumber, startDate: { $lt: end }, endDate: { $gt: start } };
  if (excludeBookingId) overlapFilter._id = { $ne: excludeBookingId };
  if (await Booking.exists(overlapFilter)) { const error = new Error('Booking dates overlap for this car'); error.status = 409; throw error; }
  const rentalDays = Math.ceil((end - start) / DAY_MS);
  return { start, end, totalAmount: rentalDays * car.pricePerDay };
};
module.exports = { validateAndPrice };
