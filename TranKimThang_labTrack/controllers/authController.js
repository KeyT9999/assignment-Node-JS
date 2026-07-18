const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    // Only laboratory_manager may register new users
    if (!req.user || req.user.role !== 'laboratory_manager') {
      return res.status(403).json({
        message: 'Forbidden: Only laboratory_manager can register new users'
      });
    }

    const {
      username,
      password,
      fullName,
      role,
      assignedLaboratory
    } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        message: 'Username, password and fullName are required'
      });
    }

    // Do not allow another laboratory_manager account to be created through this API
    if (role === 'laboratory_manager') {
      return res.status(400).json({
        message: 'Cannot register another laboratory manager via API'
      });
    }

    // A laboratory_technician account must include assignedLaboratory
    const userRole = role || 'laboratory_technician';
    if (userRole === 'laboratory_technician' && !assignedLaboratory) {
      return res.status(400).json({
        message: 'assignedLaboratory is required for laboratory_technician'
      });
    }

    // Return 409 if the username already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }

    const user = await User.create({
      username,
      password,
      fullName,
      role: userRole,
      assignedLaboratory: userRole === 'laboratory_technician' ? assignedLaboratory : null
    });

    res.status(201).json({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      assignedLaboratory: user.assignedLaboratory
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      username,
      password
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Return 403 for a deactivated account
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is deactivated. Contact your laboratory manager.'
      });
    }

    // The token must include userId, role, fullName, and assignedLaboratory
    const token = jwt.sign({
      userId: user._id,
      role: user.role,
      fullName: user.fullName,
      assignedLaboratory: user.assignedLaboratory
    }, process.env.JWT_SECRET || 'replace_with_a_long_random_secret', {
      expiresIn: '1d'
    });

    res.json({
      token,
      user: {
        userId: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedLaboratory: user.assignedLaboratory
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
