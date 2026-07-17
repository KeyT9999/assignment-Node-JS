const r = require('express');
const c = require('../controllers/accountController');
r.post('/', verifyToken, requireRole('billing_manager'), c.customer);
module.exports = r;
