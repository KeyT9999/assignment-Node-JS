const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Resource = require('../models/resourceModel');
const Booking = require('../models/bookingModel');

const seedDB = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sdn302_pe_template';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Resource.deleteMany({});
    await Booking.deleteMany({});

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('123456', salt);
    const hashedUserPassword = await bcrypt.hash('123456', salt);

    // 1. Seed Users
    console.log('Seeding users...');
    const users = await User.create([
      {
        username: 'admin1',
        password: hashedAdminPassword,
        role: 'admin',
        balance: 1000000
      },
      {
        username: 'user1',
        password: hashedUserPassword,
        role: 'customer',
        balance: 1000000
      }
    ]);

    // 2. Seed Resources
    console.log('Seeding resources...');
    const resources = await Resource.create([
      {
        resourceCode: 'MR-201',
        name: 'Meeting Room 201',
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        pricePerUnit: 150000,
        features: ['projector', 'whiteboard', 'air-conditioner']
      },
      {
        resourceCode: 'EV-FAST-HANOI-01',
        name: 'Fast Charger Hanoi 01',
        type: 'FastCharge',
        capacity: 1,
        status: 'available',
        pricePerUnit: 3850,
        features: ['CCS2', 'CHAdeMO']
      }
    ]);

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin   : username: admin1, password: 123456');
    console.log('- Customer: username: user1, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Resources:');
    console.log(`- Meeting Room ID: ${resources[0]._id} (Code: MR-201)`);
    console.log(`- EV Station ID  : ${resources[1]._id} (Code: EV-FAST-HANOI-01)`);
    console.log('------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

// Run the script directly
seedDB();
