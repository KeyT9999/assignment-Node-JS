/**
 * @file managerModeSmoke.js
 * @description Tập tin kiểm thử tự động chế độ "Manager Only" (Chỉ cho phép tài khoản Quản lý đăng ký tài khoản mới).
 * Giả lập và kiểm thử các tính năng nâng cao:
 * - Ràng buộc đăng ký tài khoản chỉ khi đã đăng nhập với vai trò quản lý.
 * - Ràng buộc kiểm tra trường liên kết (assignedWarehouse) bắt buộc cho một số vai trò nhất định (ví dụ: stock_keeper).
 * - Lưu trữ thông tin liên kết vào JWT token.
 */

// Cấu hình động biến môi trường cụ thể cho chế độ manager_only trước khi require các file cấu hình chính.
process.env.PORT = '10082';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/trankimthang_auth_manager_test';
process.env.AUTH_REGISTRATION_MODE = 'manager_only'; // Bật chế độ chỉ Quản lý mới được tạo tài khoản
process.env.AUTH_ALLOWED_ROLES = 'warehouse_manager,stock_keeper,auditor';
process.env.AUTH_DEFAULT_ROLE = 'stock_keeper';
process.env.AUTH_MANAGER_ROLES = 'warehouse_manager';
process.env.AUTH_ASSIGNMENT_FIELD = 'assignedWarehouse'; // Ràng buộc liên kết với kho hàng
process.env.AUTH_ASSIGNMENT_REF = 'Warehouse';
process.env.AUTH_ASSIGNMENT_REQUIRED_ROLES = 'stock_keeper'; // Vai trò stock_keeper bắt buộc phải gán kho hàng

require('dotenv').config();
const assert = require('assert/strict');
const mongoose = require('mongoose');
const { startServer, stopServer } = require('../server');
const seedUsers = require('../utils/seedData');

const base = `http://127.0.0.1:${process.env.PORT}`;

/**
 * Hàm tiện ích hỗ trợ gửi HTTP Request.
 */
const request = async (path, options = {}) => {
  const response = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return { status: response.status, body: await response.json() };
};

/**
 * Khối chạy chính cho kịch bản test Manager-Mode.
 */
(async () => {
  try {
    // 1. Khởi động server HTTP thử nghiệm và nạp dữ liệu mẫu ban đầu.
    await startServer();
    await seedUsers();

    // TEST CASE 1: Đăng ký tài khoản mới khi KHÔNG gửi kèm token xác thực.
    // Kết quả mong đợi: Mã HTTP 401 Unauthorized (Vì đang ở chế độ manager_only).
    let result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username: 'blocked', password: '123456' })
    });
    assert.equal(result.status, 401);

    // Đăng nhập tài khoản thường (user1) để lấy token.
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'user1', password: '123456' })
    });
    const userToken = result.body.token;

    // TEST CASE 2: Dùng token tài khoản thường gửi request đăng ký tài khoản mới.
    // Kết quả mong đợi: Mã HTTP 403 Forbidden (Vì tài khoản thường không có vai trò quản lý).
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ username: 'blocked2', password: '123456' })
    });
    assert.equal(result.status, 403);

    // Đăng nhập tài khoản quản lý (manager1) để lấy token quản lý.
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'manager1', password: '123456' })
    });
    assert.equal(result.status, 200);
    const managerToken = result.body.token;

    // TEST CASE 3: Quản lý đăng ký tài khoản quản lý mới (warehouse_manager) qua API công khai
    // khi hệ thống cấu hình AUTH_ALLOW_MANAGER_CREATION_VIA_API = false.
    // Kết quả mong đợi: Mã HTTP 400 Bad Request.
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username: 'fake_manager', password: '123456', role: 'warehouse_manager' })
    });
    assert.equal(result.status, 400);

    // TEST CASE 4: Quản lý đăng ký tài khoản thủ kho (stock_keeper) nhưng thiếu trường liên kết kho hàng (assignedWarehouse).
    // Kết quả mong đợi: Mã HTTP 400 Bad Request (Vì stock_keeper yêu cầu bắt buộc liên kết kho).
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username: 'no_assignment', password: '123456', role: 'stock_keeper' })
    });
    assert.equal(result.status, 400);

    // TEST CASE 5: Quản lý đăng ký thủ kho hợp lệ (có truyền kèm mã ObjectId kho hàngassignedWarehouse).
    // Kết quả mong đợi: Mã HTTP 201 Created và chứa thông tin kho hàng được liên kết.
    const username = `keeper_${Date.now()}`;
    const assignedWarehouse = new mongoose.Types.ObjectId().toString();
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username, password: '123456', fullName: 'Keeper Test', role: 'stock_keeper', assignedWarehouse })
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.assignedWarehouse, assignedWarehouse);

    // TEST CASE 6: Đăng nhập bằng thủ kho mới tạo để kiểm chứng dữ liệu trả về và payload JWT token chứa liên kết kho.
    // Kết quả mong đợi: Mã HTTP 200 OK và thông tin trả về chứa assignedWarehouse chính xác.
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password: '123456' })
    });
    assert.equal(result.status, 200);
    assert.equal(result.body.user.assignedWarehouse, assignedWarehouse);

    console.log('Manager-mode smoke tests passed: 401, 403, manager block, required assignment, JWT assignment');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    // Dọn dẹp các tài khoản mẫu rác đã chèn trong quá trình test.
    await mongoose.connection.collection('users').deleteMany({ username: /^(keeper_|blocked|fake_manager|no_assignment)/ });
    // Giải phóng tài nguyên server & database.
    await stopServer();
  }
})();

