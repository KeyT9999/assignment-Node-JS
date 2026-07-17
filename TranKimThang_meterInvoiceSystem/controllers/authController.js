const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
exports.register = async (req, res) => {
  try {
    if (req.user.role !== 'billing_manager') return res.status(403).json({
      message: 'Manager only'
    });
    if (await User.exists({
      username: req.body.username
    })) return res.status(409).json({
      message: 'Username already exists'
    });
    if (req.body.role === 'billing_manager') return res.status(400).json({
      message: 'Manager accounts cannot be created here'
    });
    if ((req.body.role || 'meter_reader') === 'meter_reader' && !req.body.assignedZone) return res.status(400).json({
      message: 'Assignment is required'
    });
    const u = await User.create({
      ...req.body,
      role: req.body.role || 'meter_reader'
    });
    res.status(201).json({
      id: u._id,
      username: u.username,
      role: u.role
    });
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.login = async (req, res) => {
  const u = await User.findOne({
    username: req.body.username
  });
  if (!u || !await bcrypt.compare(req.body.password || '', u.password)) return res.status(401).json({
    message: 'Invalid credentials'
  });
  if (!u.isActive) return res.status(403).json({
    message: 'Account is deactivated. Contact your manager.'
  });
  const token = jwt.sign({
    userId: u._id,
    role: u.role,
    fullName: u.fullName,
    assignedZone: u.assignedZone
  }, process.env.JWT_SECRET || 'pe-secret', {
    expiresIn: '1d'
  });
  res.json({
    token
  });
};
