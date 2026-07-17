const r = require('express');
const c = require('../controllers/accountController');
r.post('/', verifyToken, requireRole('billing_manager'), c.tariff);
module.exports = r;
