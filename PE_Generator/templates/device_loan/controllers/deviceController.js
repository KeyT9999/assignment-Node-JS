const Device = require('../models/deviceModel');

exports.list = async (req, res) => {
  try {
    const devices = await Device.find().sort({ deviceName: 1 });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
