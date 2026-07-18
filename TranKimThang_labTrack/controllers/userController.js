const User = require('../models/userModel');
exports.list = async (_req, res) => {
  try {
    res.json(await User.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await User.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await User.findByIdAndUpdate(req.params.id || req.params.userId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'User not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await User.findByIdAndDelete(req.params.id || req.params.userId);
    return item ? res.json({
      message: 'User deleted'
    }) : res.status(404).json({
      message: 'User not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
