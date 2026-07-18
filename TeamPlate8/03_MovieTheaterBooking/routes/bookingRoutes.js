const r = require('express').Router(), c = require('../controllers/bookingController');
r.get('/', c.list);
r.post('/', c.create);
r.put('/:bookingId', c.update);
r.delete('/:bookingId', c.remove);
module.exports = r;
