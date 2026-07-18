const r = require('express').Router(), c = require('../controllers/productController'), {
  verifyToken,
  requireRole
}
 = require('../middleware/authMiddleware');
r.use(verifyToken);
r.get('/', requireRole('warehouse_manager', 'stock_keeper', 'auditor'), c.list);
r.post('/', requireRole('warehouse_manager'), c.create);
module.exports = r;
