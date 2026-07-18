const TestExecution = require('../models/testExecutionModel');
exports.list = async (_req, res) => {
  try {
    res.json(await TestExecution.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await TestExecution.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await TestExecution.findByIdAndUpdate(req.params.id || req.params.testExecutionId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'TestExecution not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await TestExecution.findByIdAndDelete(req.params.id || req.params.testExecutionId);
    return item ? res.json({
      message: 'TestExecution deleted'
    }) : res.status(404).json({
      message: 'TestExecution not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
