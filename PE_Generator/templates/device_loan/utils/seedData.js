require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const Device = require('../models/deviceModel');
const Loan = require('../models/loanModel');

(async () => {
  try {
    await connectDB();
    await Promise.all([User.deleteMany(), Device.deleteMany(), Loan.deleteMany()]);

    // Seed test users with pre-hashed default password '123'
    const admin = await User.create({
      username: 'admin1',
      password: '123',
      role: 'admin'
    });

    const student = await User.create({
      username: 'student1',
      password: '123',
      role: 'student'
    });

    const devices = await Device.insertMany([
      {
        deviceName: 'Laptop Dell Inspiron',
        category: 'Laptop',
        totalQuantity: 5,
        availableQuantity: 5,
        depositFee: 50000,
        finePerDay: 10000,
        status: 'available'
      },
      {
        deviceName: 'iPad Air',
        category: 'Tablet',
        totalQuantity: 3,
        availableQuantity: 3,
        depositFee: 30000,
        finePerDay: 5000,
        status: 'available'
      },
      {
        deviceName: 'Projector Sony',
        category: 'Projector',
        totalQuantity: 2,
        availableQuantity: 0,
        depositFee: 100000,
        finePerDay: 20000,
        status: 'maintenance'
      }
    ]);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Database seeding error:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
