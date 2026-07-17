const r=require('express').Router(),c=require('../controllers/menuItemController'),auth=require('../middlewares/authMiddleware');r.get('/',c.list);r.post('/',auth,c.create);module.exports=r;
