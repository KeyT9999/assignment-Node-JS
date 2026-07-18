const Model = require('../models/deliveryZoneModel');
exports.list = async (req, res) => res.json(await Model.find());
exports.create = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({
    message: 'Admin access required'
  });
  try {
    res.status(201).json(await Model.create(req.body));
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
