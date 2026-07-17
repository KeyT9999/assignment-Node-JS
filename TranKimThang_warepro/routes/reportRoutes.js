const r = require('express').Router(), c = require('../controllers/reportController'), {
  verifyToken,
  requireRole
}
 = require('../middleware/authMiddleware');
r.use(verifyToken, requireRole('warehouse_manager', 'auditor'));
r.get('/stock-summary', c.stockSummary);
r.get('/transactions', c.transactions);
module.exports = r;
