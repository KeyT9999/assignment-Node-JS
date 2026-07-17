// seed.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

mongoose.connect('mongodb://localhost:27017/eventDB', );

const seedUsers = async () => {
  await User.deleteMany({});
  const password = await bcrypt.hash('123456', 10);
  await User.insertMany([
    { username: 'admin123', password, role: 'admin' },
    { username: 'student01', password, role: 'student' },
    { username: 'student02', password, role: 'student' }
  ]);
  console.log('Seeded users');
  mongoose.disconnect();
};

seedUsers();