/**
 * @file authSmoke.js
 * @description Tập tin kiểm thử tự động dạng Smoke Test (kiểm thử nhanh) dành cho phân hệ xác thực.
 * Thiết lập cơ sở dữ liệu riêng, khởi chạy server thử nghiệm, thực hiện gửi HTTP requests
 * và kiểm tra các hành vi cơ bản (Đăng ký, Đăng nhập, Phân quyền, Tài khoản bị vô hiệu hóa).
 */

require('dotenv').config();
const assert = require('assert/strict');
const mongoose = require('mongoose');

// Thiết lập cấu hình cổng mạng và đường dẫn cơ sở dữ liệu MongoDB phục vụ riêng cho môi trường kiểm thử.
process.env.PORT = '10081';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/trankimthang_auth_test';

const { startServer, stopServer } = require('../server');
const seedUsers = require('../utils/seedData');

// Địa chỉ gốc URL của server kiểm thử.
const base = `http://127.0.0.1:${process.env.PORT}`;

/**
 * Hàm tiện ích thực hiện gửi HTTP request đến API server bằng Fetch API.
 * Tự động thiết lập Content-Type là JSON và phân tích kết quả trả về.
 * 
 * @async
 * @param {string} path - Đường dẫn tương đối của endpoint API (ví dụ: '/auth/login').
 * @param {Object} [options={}] - Các thiết lập HTTP (method, headers, body,...).
 * @returns {Promise<{status: number, body: Object}>} Phản hồi từ Server gồm HTTP status và body JSON.
 */
const request = async (path, options = {}) => {
  const response = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  return { status: response.status, body };
};

/**
 * Khối tự khởi chạy thực hiện quy trình kiểm thử.
 */
(async () => {
  try {
    // 1. Khởi động server HTTP thử nghiệm và nạp dữ liệu mẫu ban đầu.
    await startServer();
    await seedUsers();

    const username = `smoke_${Date.now()}`;
    
    // TEST CASE 1: Đăng ký một tài khoản mới hợp lệ.
    // Kết quả mong đợi: Mã HTTP 201 Created.
    let result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, password: '123456', fullName: 'Smoke User' })
    });
    assert.equal(result.status, 201);

    // TEST CASE 2: Đăng ký trùng tên đăng nhập đã có.
    // Kết quả mong đợi: Mã HTTP 409 Conflict.
    result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, password: '123456', fullName: 'Smoke User' })
    });
    assert.equal(result.status, 409);

    // TEST CASE 3: Đăng ký vai trò quản lý (admin) qua API công khai khi hệ thống không cho phép leo thang đặc quyền.
    // Kết quả mong đợi: Mã HTTP 400 Bad Request.
    result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username: 'fakeadmin', password: '123456', role: 'admin' })
    });
    assert.equal(result.status, 400);

    // TEST CASE 4: Đăng nhập bằng tài khoản vừa đăng ký.
    // Kết quả mong đợi: Mã HTTP 200 OK và nhận về JWT token.
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password: '123456' })
    });
    assert.equal(result.status, 200);
    assert.ok(result.body.token);
    const customerToken = result.body.token;

    // TEST CASE 5: Gọi API lấy thông tin cá nhân (/auth/me) kèm token xác thực hợp lệ.
    // Kết quả mong đợi: Mã HTTP 200 OK.
    result = await request('/auth/me', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.equal(result.status, 200);

    // TEST CASE 6: Truy cập API yêu cầu quyền quản lý (/demo/manager) bằng tài khoản thường.
    // Kết quả mong đợi: Mã HTTP 403 Forbidden (Bị từ chối truy cập do thiếu vai trò).
    result = await request('/demo/manager', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.equal(result.status, 403);

    // TEST CASE 7: Đăng nhập bằng tài khoản bị vô hiệu hóa (deactivated1).
    // Kết quả mong đợi: Mã HTTP 403 Forbidden (Tài khoản không hoạt động).
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'deactivated1', password: '123456' })
    });
    assert.equal(result.status, 403);

    // TEST CASE 8: Đăng nhập sai mật khẩu.
    // Kết quả mong đợi: Mã HTTP 401 Unauthorized (Sai thông tin đăng nhập).
    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password: 'wrong-password' })
    });
    assert.equal(result.status, 401);

    console.log('Auth smoke tests passed: register, duplicate, escalation, login, JWT, RBAC, deactivated account');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    // Dọn dẹp dữ liệu rác đã chèn trong quá trình test (xóa tài khoản có tiền tố smoke_).
    await mongoose.connection.collection('users').deleteMany({ username: /^smoke_/ });
    // Dừng server và đóng các kết nối để giải phóng tài nguyên.
    await stopServer();
  }
})();

