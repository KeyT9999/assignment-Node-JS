const r = require('express').Router(), c = require('../controllers/catalogController');
r.get('/theaters', c.theaters);
r.get('/schedules', c.schedules);
module.exports = r;
