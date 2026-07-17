const r = require('express').Router(), c = require('../controllers/transactionController'), {
  verifyToken,
  requireRole
}
 = require('../middleware/authMiddleware');
r.use(verifyToken);
r.post('/import', requireRole('warehouse_manager', 'stock_keeper'), c.importStock);
r.post('/export', requireRole('warehouse_manager', 'stock_keeper'), c.exportStock);
r.post('/transfer', requireRole('warehouse_manager'), c.transferStock);
module.exports = r;
