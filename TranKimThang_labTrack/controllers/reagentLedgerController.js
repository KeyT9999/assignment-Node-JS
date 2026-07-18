const ReagentLedger = require('../models/reagentLedgerModel');
exports.list = async (_req, res) => {
  try {
    res.json(await ReagentLedger.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await ReagentLedger.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await ReagentLedger.findByIdAndUpdate(req.params.id || req.params.reagentLedgerId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'ReagentLedger not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await ReagentLedger.findByIdAndDelete(req.params.id || req.params.reagentLedgerId);
    return item ? res.json({
      message: 'ReagentLedger deleted'
    }) : res.status(404).json({
      message: 'ReagentLedger not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
