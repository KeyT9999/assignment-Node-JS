require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const DeliveryZone = require('../models/deliveryZoneModel');
const Shipment = require('../models/shipmentModel');

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parcelDelivery';
  console.log(`Connecting to database for seeding: ${uri}`);
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to database.');

    // Clear existing data
    console.log('Clearing old data...');
    await User.deleteMany({});
    await DeliveryZone.deleteMany({});
    await Shipment.deleteMany({});

    // Hash passwords
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create users
    console.log('Seeding users...');
    const admin = await User.create({
      username: 'admin1',
      password: hashedPassword,
      role: 'admin'
    });

    const customer = await User.create({
      username: 'user1',
      password: hashedPassword,
      role: 'customer'
    });

    // Create delivery zones
    console.log('Seeding delivery zones...');
    const zone1 = await DeliveryZone.create({
      zoneCode: 'DN-CENTRAL',
      zoneName: 'Da Nang Central',
      status: 'active',
      maxWeightKg: 30,
      baseFee: 20000,
      feePerKm: 5000,
      feePerKg: 3000
    });

    const zone2 = await DeliveryZone.create({
      zoneCode: 'HN-WEST',
      zoneName: 'Hanoi West',
      status: 'suspended',
      maxWeightKg: 20,
      baseFee: 15000,
      feePerKm: 4000,
      feePerKg: 2500
    });

    const zone3 = await DeliveryZone.create({
      zoneCode: 'SG-SOUTH',
      zoneName: 'Saigon South',
      status: 'active',
      maxWeightKg: 50,
      baseFee: 25000,
      feePerKm: 6000,
      feePerKg: 3500
    });

    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log(`- Admin   : username: admin1, password: 123456`);
    console.log(`- Customer: username: user1, password: 123456`);
    console.log('------------------------------------');
    console.log('Sample Delivery Zones:');
    console.log(`- Zone 1 (Active)   : ID: ${zone1._id} (Code: ${zone1.zoneCode})`);
    console.log(`- Zone 2 (Suspended): ID: ${zone2._id} (Code: ${zone2.zoneCode})`);
    console.log(`- Zone 3 (Active)   : ID: ${zone3._id} (Code: ${zone3.zoneCode})`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Seeding database failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

seed();
