require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const authConfig = require('../config/authConfig');

async function seedUsers() {
  const managerRole = authConfig.managerRoles[0] || authConfig.allowedRoles[0];
  const normalRole = authConfig.defaultRole;
  const usernames = ['manager1', 'user1', 'deactivated1'];
  await User.deleteMany({ username: { $in: usernames } });
  await User.create([
    { username: 'manager1', password: '123456', fullName: 'System Manager', role: managerRole },
    { username: 'user1', password: '123456', fullName: 'Normal User', role: normalRole, balance: authConfig.welcomeBalance },
    { username: 'deactivated1', password: '123456', fullName: 'Deactivated User', role: normalRole, isActive: false }
  ]);
  console.log('Seeded manager1, user1 and deactivated1 (password: 123456)');
}

async function main() {
  try {
    await connectDB();
    await seedUsers();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  }
}

if (require.main === module) main();
module.exports = seedUsers;
