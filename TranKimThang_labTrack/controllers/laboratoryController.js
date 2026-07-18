const Laboratory = require('../models/laboratoryModel');
exports.list = async (_req, res) => {
  try {
    res.json(await Laboratory.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await Laboratory.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await Laboratory.findByIdAndUpdate(req.params.id || req.params.laboratoryId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'Laboratory not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await Laboratory.findByIdAndDelete(req.params.id || req.params.laboratoryId);
    return item ? res.json({
      message: 'Laboratory deleted'
    }) : res.status(404).json({
      message: 'Laboratory not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
