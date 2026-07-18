const Equipment = require('../models/equipmentModel');
exports.getEquipment = async (_req, res) => res.json(await Equipment.find());
exports.createEquipment = async (req, res) => {
  try {
    return res.status(201).json(await Equipment.create(req.body));
  }  catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};
