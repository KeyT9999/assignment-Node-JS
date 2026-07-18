/**
 * @file seedData.js
 * @description Script hỗ trợ khởi tạo dữ liệu mẫu (Seed Data) cho cơ sở dữ liệu.
 * Tự động tạo 3 tài khoản thử nghiệm ban đầu: quản lý (manager1), người dùng thường (user1)
 * và tài khoản đã bị vô hiệu hóa (deactivated1) phục vụ cho quá trình phát triển và kiểm thử.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const authConfig = require('../config/authConfig');

/**
 * Xóa bỏ và tạo mới các tài khoản người dùng mẫu trong Database.
 * 
 * @async
 * @function seedUsers
 */
async function seedUsers() {
  // Lấy vai trò quản lý đầu tiên cấu hình trong AUTH_MANAGER_ROLES làm vai trò cho quản lý mẫu.
  const managerRole = authConfig.managerRoles[0] || authConfig.allowedRoles[0];
  // Vai trò mặc định cho người dùng thường.
  const normalRole = authConfig.defaultRole;
  
  const usernames = ['manager1', 'user1', 'deactivated1'];
  
  // Dọn dẹp Database: Xóa các tài khoản trùng tên với các tài khoản mẫu định tạo.
  await User.deleteMany({ username: { $in: usernames } });
  
  // Tạo mới hàng loạt (bulk create) danh sách tài khoản mẫu.
  await User.create([
    { username: 'manager1', password: '123456', fullName: 'System Manager', role: managerRole },
    { username: 'user1', password: '123456', fullName: 'Normal User', role: normalRole, balance: authConfig.welcomeBalance },
    { username: 'deactivated1', password: '123456', fullName: 'Deactivated User', role: normalRole, isActive: false }
  ]);
  
  console.log('Seeded manager1, user1 and deactivated1 (password: 123456)');
}

/**
 * Hàm khởi chạy chính khi chạy file script trực tiếp.
 * Thực hiện kết nối cơ sở dữ liệu, chạy seed dữ liệu, sau đó đóng kết nối một cách an toàn.
 * 
 * @async
 * @function main
 */
async function main() {
  try {
    // Kết nối MongoDB
    await connectDB();
    // Thực thi nạp dữ liệu mẫu
    await seedUsers();
  } catch (error) {
    console.error(error);
    process.exitCode = 1; // Đánh dấu tiến trình kết thúc với mã lỗi
  } finally {
    // Ngắt kết nối cơ sở dữ liệu sau khi hoàn tất công việc
    if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  }
}

// Nếu chạy file này trực tiếp từ command line, tiến hành chạy hàm main()
if (require.main === module) main();

module.exports = seedUsers;

