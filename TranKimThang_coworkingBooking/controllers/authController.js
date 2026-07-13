const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, password, role, balance } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userRole = role || 'customer';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userBalance = balance;
    if (userBalance === undefined) {

      if (userRole === 'customer' && process.env.PRICING_MODE === 'EV') {
        userBalance = 50;
      } else {
        userBalance = 0;
      }
    }

    const user = await User.create({
      username,
      password: hashedPassword,
      role: userRole,
      balance: userBalance
    });

    const userResponse = {
      _id: user._id,
      username: user.username,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt
    };

    return res.status(201).json(userResponse);
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'sdn302_secret_key',
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports = {
  register,
  login
};
