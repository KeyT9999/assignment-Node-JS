process.env.PORT = '10082';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/trankimthang_auth_manager_test';
process.env.AUTH_REGISTRATION_MODE = 'manager_only';
process.env.AUTH_ALLOWED_ROLES = 'warehouse_manager,stock_keeper,auditor';
process.env.AUTH_DEFAULT_ROLE = 'stock_keeper';
process.env.AUTH_MANAGER_ROLES = 'warehouse_manager';
process.env.AUTH_ASSIGNMENT_FIELD = 'assignedWarehouse';
process.env.AUTH_ASSIGNMENT_REF = 'Warehouse';
process.env.AUTH_ASSIGNMENT_REQUIRED_ROLES = 'stock_keeper';

require('dotenv').config();
const assert = require('assert/strict');
const mongoose = require('mongoose');
const { startServer, stopServer } = require('../server');
const seedUsers = require('../utils/seedData');

const base = `http://127.0.0.1:${process.env.PORT}`;
const request = async (path, options = {}) => {
  const response = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return { status: response.status, body: await response.json() };
};

(async () => {
  try {
    await startServer();
    await seedUsers();

    let result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username: 'blocked', password: '123456' })
    });
    assert.equal(result.status, 401);

    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'user1', password: '123456' })
    });
    const userToken = result.body.token;
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ username: 'blocked2', password: '123456' })
    });
    assert.equal(result.status, 403);

    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'manager1', password: '123456' })
    });
    assert.equal(result.status, 200);
    const managerToken = result.body.token;

    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username: 'fake_manager', password: '123456', role: 'warehouse_manager' })
    });
    assert.equal(result.status, 400);

    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username: 'no_assignment', password: '123456', role: 'stock_keeper' })
    });
    assert.equal(result.status, 400);

    const username = `keeper_${Date.now()}`;
    const assignedWarehouse = new mongoose.Types.ObjectId().toString();
    result = await request('/auth/register', {
      method: 'POST', headers: { Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ username, password: '123456', fullName: 'Keeper Test', role: 'stock_keeper', assignedWarehouse })
    });
    assert.equal(result.status, 201);
    assert.equal(result.body.assignedWarehouse, assignedWarehouse);

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
    await mongoose.connection.collection('users').deleteMany({ username: /^(keeper_|blocked|fake_manager|no_assignment)/ });
    await stopServer();
  }
})();
