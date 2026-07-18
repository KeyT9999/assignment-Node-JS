const r = require('express').Router(), c = require('../controllers/registrationController'), {
  protect
}
 = require('../middlewares/authMiddleware'), {
  authorizeRoles
}
 = require('../middlewares/roleMiddleware');
r.post('/registrations', protect, authorizeRoles('student'), c.register);
r.delete('/registrations/:registrationId', protect, authorizeRoles('student'), c.unregister);
r.get('/listRegistrations', protect, authorizeRoles('admin'), c.list);
r.get('/getRegistrationsByDate', protect, authorizeRoles('admin'), c.byDate);
module.exports = r;
