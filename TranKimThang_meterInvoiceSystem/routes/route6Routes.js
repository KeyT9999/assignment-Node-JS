const r = require('express');
const c = require('../controllers/reportController');
r.get('/', verifyToken, requireRole('billing_manager', 'auditor'), c.consumption);
module.exports = r;
