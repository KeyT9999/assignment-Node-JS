const Model=require('../models/menuItemModel');
exports.list=async(req,res)=>res.json(await Model.find());
exports.create=async(req,res)=>{try{res.status(201).json(await Model.create(req.body));}catch(e){res.status(400).json({message:e.message});}};
