const r=require('express').Router(),c=require('../controllers/roomController');r.get('/',c.list);module.exports=r;
