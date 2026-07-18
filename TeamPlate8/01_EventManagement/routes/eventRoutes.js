const r = require('express').Router(), c = require('../controllers/eventController'), {
  protect
}
 = require('../middlewares/authMiddleware');
r.get('/', protect, c.list);
module.exports = r;
