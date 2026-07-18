const TestCatalogue = require('../models/testCatalogueModel');
exports.list = async (_req, res) => {
  try {
    res.json(await TestCatalogue.find());
  }  catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
};
exports.create = async (req, res) => {
  try {
    res.status(201).json(await TestCatalogue.create(req.body));
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.update = async (req, res) => {
  try {
    const item = await TestCatalogue.findByIdAndUpdate(req.params.id || req.params.testCatalogueId, req.body, {
      new: true,
      runValidators: true
    });
    return item ? res.json(item) : res.status(404).json({
      message: 'TestCatalogue not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.remove = async (req, res) => {
  try {
    const item = await TestCatalogue.findByIdAndDelete(req.params.id || req.params.testCatalogueId);
    return item ? res.json({
      message: 'TestCatalogue deleted'
    }) : res.status(404).json({
      message: 'TestCatalogue not found'
    });
  }  catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
