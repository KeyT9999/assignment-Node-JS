const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Space = require('../models/spaceModel');
const Reservation = require('../models/reservationModel');

const seedDB = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sdn302_pe_template';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Space.deleteMany({});
    await Reservation.deleteMany({});

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

    // 2. Seed Spaces
    console.log('Seeding resources...');
    const resources = await Space.create([
      {
        spaceCode: 'MR-201',
        
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        pricePerHour: 150000,
        amenities: ['projector', 'whiteboard', 'air-conditioner']
      },
      {
        spaceCode: 'MR-202',
        
        type: 'meetingRoom',
        capacity: 8,
        status: 'available',
        pricePerHour: 160000,
        amenities: ['projector', 'whiteboard', 'air-conditioner']
      }
    ]);

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin   : username: admin1, password: 123456');
    console.log('- Customer: username: user1, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Spaces:');
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
