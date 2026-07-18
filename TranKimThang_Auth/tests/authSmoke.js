require('dotenv').config();
const assert = require('assert/strict');
const mongoose = require('mongoose');

process.env.PORT = '10081';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/trankimthang_auth_test';

const { startServer, stopServer } = require('../server');
const seedUsers = require('../utils/seedData');

const base = `http://127.0.0.1:${process.env.PORT}`;
const request = async (path, options = {}) => {
  const response = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json();
  return { status: response.status, body };
};

(async () => {
  try {
    await startServer();
    await seedUsers();

    const username = `smoke_${Date.now()}`;
    let result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, password: '123456', fullName: 'Smoke User' })
    });
    assert.equal(result.status, 201);

    result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username, password: '123456', fullName: 'Smoke User' })
    });
    assert.equal(result.status, 409);

    result = await request('/auth/register', {
      method: 'POST', body: JSON.stringify({ username: 'fakeadmin', password: '123456', role: 'admin' })
    });
    assert.equal(result.status, 400);

    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password: '123456' })
    });
    assert.equal(result.status, 200);
    assert.ok(result.body.token);
    const customerToken = result.body.token;

    result = await request('/auth/me', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.equal(result.status, 200);

    result = await request('/demo/manager', { headers: { Authorization: `Bearer ${customerToken}` } });
    assert.equal(result.status, 403);

    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username: 'deactivated1', password: '123456' })
    });
    assert.equal(result.status, 403);

    result = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password: 'wrong-password' })
    });
    assert.equal(result.status, 401);

    console.log('Auth smoke tests passed: register, duplicate, escalation, login, JWT, RBAC, deactivated account');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.collection('users').deleteMany({ username: /^smoke_/ });
    await stopServer();
  }
})();
