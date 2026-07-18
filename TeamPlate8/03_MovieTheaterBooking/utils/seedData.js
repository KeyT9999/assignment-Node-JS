require('dotenv').config();
const mongoose = require('mongoose'), connectDB = require('../config/db'), Theater = require('../models/theaterModel'), Schedule = require('../models/scheduleModel'), Booking = require('../models/bookingModel');
(async () => {
  try {
    await connectDB();
    await Promise.all([Booking.deleteMany(), Schedule.deleteMany(), Theater.deleteMany()]);
    await Theater.create([{
      theaterName: 'Cineplex Downtown',
      location: '123 Main St, Cityville',
      seatCapacity: 150,
      screenType: 'IMAX',
      amenities: ['Recliner seats',
      'Dolby Atmos',
      'Snack Bar']
    }, {
      theaterName: 'FPT Cinema',
      location: 'Da Nang',
      seatCapacity: 100,
      screenType: '3D',
      amenities: ['Dolby Atmos']
    }]);
    await Schedule.create([{
      movieName: 'Inception',
      theaterName: 'Cineplex Downtown',
      showTime: '2027-05-15T20:00:00Z',
      ticketPrice: 12.5,
      availableSeats: 100
    }, {
      movieName: 'Interstellar',
      theaterName: 'FPT Cinema',
      showTime: '2027-05-16T19:00:00Z',
      ticketPrice: 10,
      availableSeats: 80
    }]);
    console.log('Movie seed completed')
  } catch (e) {
    console.error(e);
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
})();
