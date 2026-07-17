const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
exports.register = async (req,res) => { try {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({message:'username and password are required'});
  if (await User.findOne({username})) return res.status(409).json({message:'Username already exists'});
  const user = await User.create({username, password:await bcrypt.hash(password,10), role:'customer'});
  res.status(201).json({id:user._id,username:user.username,role:user.role});
} catch(e){res.status(500).json({message:e.message});} };
exports.login = async (req,res) => { try {
  const user=await User.findOne({username:req.body.username});
  if(!user || !(await bcrypt.compare(req.body.password,user.password))) return res.status(401).json({message:'Invalid credentials'});
  const token=jwt.sign({userId:user._id,role:user.role},process.env.JWT_SECRET||'pe-secret',{expiresIn:'1d'});
  res.json({token});
} catch(e){res.status(500).json({message:e.message});} };
