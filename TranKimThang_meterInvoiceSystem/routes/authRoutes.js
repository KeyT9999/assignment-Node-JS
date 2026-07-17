const r = require('express');
const c = require('../controllers/authController');
r.post('/register', verifyToken, c.register);
r.post('/login', c.login);
module.exports = r;
