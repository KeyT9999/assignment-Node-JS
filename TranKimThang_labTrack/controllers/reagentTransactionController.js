const ReagentTransaction = require('../models/reagentTransactionModel');
exports.list = async (_req, res) => {
  try {
    res.json(await ReagentTransaction.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await ReagentTransaction.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await ReagentTransaction.findByIdAndUpdate(req.params.id || req.params.reagentTransactionId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'ReagentTransaction not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await ReagentTransaction.findByIdAndDelete(req.params.id || req.params.reagentTransactionId);
    return item ? res.json({
      message: 'ReagentTransaction deleted'
    }) : res.status(404).json({
      message: 'ReagentTransaction not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
