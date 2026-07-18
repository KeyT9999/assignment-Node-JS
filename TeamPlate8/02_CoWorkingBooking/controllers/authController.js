const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      username,
      password,
      role
    }
 = req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    // Check if user already exists
    const userExists = await User.findOne({
      username
    });
    if (userExists) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }
    // Set default role if not provided
    const userRole = role || 'customer';
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Set default balance
    let userBalance = balance;
    if (userBalance === undefined) {
      // If EV mode is active, automatic $50.00 welcome bonus for customers
      if (userRole === 'customer' && process.env.PRICING_MODE === 'EV') {
        userBalance = 50;
      }  else {
        userBalance = 0;
      }
    }
    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      role: userRole,
      balance: userBalance
    });
    // Return created user without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt
    };
    return res.status(201).json(userResponse);
  }  catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({
      message: 'Server error during registration'
    });
  }
};
// @desc    Authenticate a user & get token
// @route   POST /auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const {
      username,
      password
    }
 = req.body;
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }
    // Find user by username
    const user = await User.findOne({
      username
    });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }
    // Generate JWT token containing id, username, role
    const token = jwt.sign({
      id: user._id,
      username: user.username,
      role: user.role
    }, process.env.JWT_SECRET || 'sdn302_secret_key', {
      expiresIn: '30d'
    }     );
    // Return user info and token
    return res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  }  catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      message: 'Server error during login'
    });
  }
};
module.exports = {
  register,
  login
};
