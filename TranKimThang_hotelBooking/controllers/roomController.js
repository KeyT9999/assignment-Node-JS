const Room=require('../models/roomModel');exports.list=async(_q,s)=>s.json(await Room.find());
