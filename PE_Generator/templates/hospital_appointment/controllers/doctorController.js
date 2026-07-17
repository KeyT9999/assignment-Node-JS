const Doctor=require('../models/doctorModel');exports.list=async(_req,res)=>{try{res.status(200).json(await Doctor.find())}catch(e){res.status(500).json({message:e.message})}};
