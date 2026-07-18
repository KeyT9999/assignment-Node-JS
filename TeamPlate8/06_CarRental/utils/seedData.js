require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Car = require('../models/carModel');
const Booking = require('../models/bookingModel');
(async () => {
  try {
    await connectDB();
    await Promise.all([Car.deleteMany(), Booking.deleteMany()]);
    await Car.create([{
      carNumber: '51A-12345',
      capacity: 7,
      status: 'available',
      pricePerDay: 500000,
      features: ['automatic',
      'air-conditioner',
      'GPS']
    }, {
      carNumber: '43A-67890',
      capacity: 5,
      status: 'available',
      pricePerDay: 350000,
      features: ['automatic',
      'bluetooth']
    }]);
    console.log('Seed completed')
  } catch (e) {
    console.error(e);
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
})();
