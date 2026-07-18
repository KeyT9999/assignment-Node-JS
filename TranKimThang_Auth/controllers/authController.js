const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authConfig = require('../config/authConfig');

const publicUser = user => {
  const value = {
    userId: user._id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    balance: user.balance,
    createdAt: user.createdAt
  };
  if (authConfig.assignmentField) {
    value[authConfig.assignmentField] = user[authConfig.assignmentField] || null;
  }
  return value;
};

exports.register = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const fullName = String(req.body.fullName || username).trim();
    const requestedRole = req.body.role || authConfig.defaultRole;

    if (!username || !password || !fullName) {
      return res.status(400).json({ message: 'username, password and fullName are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must contain at least 6 characters' });
    }
    if (!authConfig.allowedRoles.includes(requestedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (authConfig.managerRoles.includes(requestedRole) && !authConfig.allowManagerCreationViaApi) {
      return res.status(400).json({ message: authConfig.managerCreationMessage });
    }
    if (await User.exists({ username })) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const assignment = authConfig.assignmentField ? req.body[authConfig.assignmentField] : undefined;
    if (authConfig.assignmentRequiredRoles.includes(requestedRole) && !assignment) {
      return res.status(400).json({ message: `${authConfig.assignmentField} is required for role ${requestedRole}` });
    }

    const data = {
      username,
      password,
      fullName,
      role: requestedRole,
      balance: requestedRole === authConfig.defaultRole ? authConfig.welcomeBalance : 0
    };
    if (authConfig.assignmentField) data[authConfig.assignmentField] = assignment || null;

    const user = await User.create(data);
    return res.status(201).json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const username = String(req.body.username || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ username }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: authConfig.deactivatedMessage });
    }

    const payload = {
      userId: user._id,
      role: user.role,
      fullName: user.fullName
    };
    if (authConfig.assignmentField) {
      payload[authConfig.assignmentField] = user[authConfig.assignmentField] || null;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: authConfig.jwtExpiresIn
    });
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account is unavailable' });
    }
    return res.json(publicUser(user));
  } catch (error) {
    return next(error);
  }
};
