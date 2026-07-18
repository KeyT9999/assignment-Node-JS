const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
// Load environment variables
require('dotenv').config({
  path: path.join(__dirname,
  '../.env')
});
const User = require('../models/userModel');
const Space = require('../models/spaceModel');
const Reservation = require('../models/reservationModel');
const seedDB = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coworkingBooking';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({
    });
    await Space.deleteMany({
    });
    await Reservation.deleteMany({
    });
    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('123456', salt);
    const hashedUserPassword = await bcrypt.hash('123456', salt);
    // 1. Seed Users
    console.log('Seeding users...');
    const users = await User.create([{
      username: 'admin1',
      password: hashedAdminPassword,
      role: 'admin',
      balance: 1000000
    }, {
      username: 'user1',
      password: hashedUserPassword,
      role: 'customer',
      balance: 1000000
    }     ]);
    // 2. Seed Spaces
    console.log('Seeding spaces...');
    const spaces = await Space.create([{
      spaceCode: 'MR-201',
      type: 'meetingRoom',
      capacity: 8,
      status: 'available',
      pricePerHour: 150000,
      amenities: ['projector',
      'whiteboard',
      'air-conditioner']
    }, {
      spaceCode: 'DK-101',
      type: 'desk',
      capacity: 1,
      status: 'available',
      pricePerHour: 50000,
      amenities: ['power-outlet',
      'monitor']
    }     ]);
    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin   : username: admin1, password: 123456');
    console.log('- Customer: username: user1, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Spaces:');
    console.log(`- Space 1 ID: ${spaces[0]._id} (Code: ${spaces[0].spaceCode})`);
    console.log(`- Space 2 ID: ${spaces[1]._id} (Code: ${spaces[1].spaceCode})`);
    console.log('------------------------------------');
    process.exit(0);
  }  catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};
// Run the script directly
seedDB();
