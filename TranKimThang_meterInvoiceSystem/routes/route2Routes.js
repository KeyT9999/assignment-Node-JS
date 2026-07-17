const r = require('express');
const c = require('../controllers/accountController');
r.get('/', verifyToken, requireRole('billing_manager', 'meter_reader', 'auditor'), c.list);
module.exports = r;
