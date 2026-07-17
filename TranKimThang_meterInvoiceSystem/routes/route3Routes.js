const r = require('express');
const c = require('../controllers/billingController');
r.post('/', verifyToken, requireRole('billing_manager', 'meter_reader'), c.reading);
module.exports = r;
