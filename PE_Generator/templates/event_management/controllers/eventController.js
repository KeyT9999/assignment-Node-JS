const Event=require('../models/eventModel');exports.list=async(_q,s)=>s.json(await Event.find().sort({date:1}));
