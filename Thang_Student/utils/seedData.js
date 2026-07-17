const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/userModel');
const Event = require('../models/eventModel');
const Registration = require('../models/registrationModel');

const seedDB = async () => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projectBooking';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Registration.deleteMany({});

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Seed Users
    console.log('Seeding users...');
    const users = await User.create([
      {
        username: 'admin1',
        password: hashedPassword,
        role: 'admin',
      },
      {
        username: 'student1',
        password: hashedPassword,
        role: 'student',
      },
      {
        username: 'student2',
        password: hashedPassword,
        role: 'student',
      }
    ]);

    // 2. Read events from db.json and Seed Events
    console.log('Reading db.json...');
    const dbJsonPath = path.join(__dirname, '../db.json');
    if (!fs.existsSync(dbJsonPath)) {
      throw new Error(`db.json not found at ${dbJsonPath}`);
    }
    const rawEvents = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));

    console.log('Seeding events...');
    const events = await Event.create(rawEvents);

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin  : username: admin1, password: 123456');
    console.log('- Student: username: student1, password: 123456');
    console.log('- Student: username: student2, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Events (from db.json):');
    events.forEach(e => {
      console.log(`- Event: "${e.name}" | Capacity: ${e.capacity} | ID: ${e._id}`);
    });
    console.log('------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

// Run the script directly
seedDB();
