const r=require('express').Router(),c=require('../controllers/doctorController');r.get('/',c.list);module.exports=r;
