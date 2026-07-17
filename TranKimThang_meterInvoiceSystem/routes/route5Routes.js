const r = require('express');
const c = require('../controllers/billingController');
r.post('/', verifyToken, requireRole('billing_manager'), c.payment);
module.exports = r;
