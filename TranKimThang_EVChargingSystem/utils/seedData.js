/**
 * @file seedData.js
 * @description Script hỗ trợ khởi tạo dữ liệu mẫu (Seed Data) cho hệ thống trạm sạc xe điện EV Charging System.
 * Tạo 2 tài khoản thử nghiệm (admin1, user1) và 2 trạm sạc mẫu (Hà Nội & TP.HCM).
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Nạp các biến môi trường từ tập tin .env
require('dotenv').config({
  path: path.join(__dirname, '../.env')
});

const User = require('../models/userModel');
const Station = require('../models/stationModel');
const Session = require('../models/sessionModel');

/**
 * Hàm chính thực hiện nạp dữ liệu mẫu vào database.
 * 
 * @async
 * @function seedDB
 */
const seedDB = async () => {
  try {
    // Kết nối tới cơ sở dữ liệu MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eVChargingSystem';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    
    // Dọn sạch dữ liệu cũ trong các collection: Users, Stations, Sessions
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Station.deleteMany({});
    await Session.deleteMany({});
    
    // Mã hóa mật khẩu mẫu "123456" cho các tài khoản thử nghiệm
    const salt = await bcrypt.genSalt(10);
    const hashedAdminPassword = await bcrypt.hash('123456', salt);
    const hashedUserPassword = await bcrypt.hash('123456', salt);
    
    // 1. Khởi tạo danh sách người dùng mẫu
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
    
    // 2. Khởi tạo danh sách các trạm sạc mẫu
    console.log('Seeding stations...');
    const stations = await Station.create([
      {
        stationCode: 'EV-FAST-HANOI-01',
        type: 'FastCharge',
        capacity: 1,
        status: 'available',
        pricePerKwh: 3850,
        connectors: ['CCS2', 'CHAdeMO']
      },
      {
        stationCode: 'EV-NORM-HCM-02',
        type: 'NormalCharge',
        capacity: 1,
        status: 'available',
        pricePerKwh: 2500,
        connectors: ['Type2']
      }
    ]);
    
    console.log('Seeding completed successfully!');
    console.log('------------------------------------');
    console.log('Test Accounts:');
    console.log('- Admin   : username: admin1, password: 123456');
    console.log('- Customer: username: user1, password: 123456');
    console.log('------------------------------------');
    console.log('Sample Stations:');
    console.log(`- Station 1 ID: ${stations[0]._id} (Code: ${stations[0].stationCode})`);
    console.log(`- Station 2 ID: ${stations[1]._id} (Code: ${stations[1].stationCode})`);
    console.log('------------------------------------');
    process.exit(0);
  }  catch (error) {
    console.error('Seeding database failed:', error.message);
    process.exit(1);
  }
};

// Thực thi việc seed data
seedDB();

