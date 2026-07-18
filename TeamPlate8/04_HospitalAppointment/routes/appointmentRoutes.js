const r = require('express').Router(), c = require('../controllers/appointmentController');
r.get('/', c.list);
r.post('/book', c.book);
r.put('/:id/complete', c.complete);
module.exports = r;
