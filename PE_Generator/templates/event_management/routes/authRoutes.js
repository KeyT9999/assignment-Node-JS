const r=require('express').Router(),c=require('../controllers/authController');r.post('/login',c.login);module.exports=r;
