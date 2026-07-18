const Station = require('../models/stationModel');
// @desc    Get all stations
// @route   GET /stations
// @access  Public (or Protected, depending on requirement)
const getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();
    return res.status(200).json(stations);
  }  catch (error) {
    console.error('Get all stations error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving stations'
    });
  }
};
// @desc    Get single station by ID
// @route   GET /stations/:id
// @access  Public
const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    return res.status(200).json(station);
  }  catch (error) {
    console.error('Get station by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    return res.status(500).json({
      message: 'Server error retrieving station'
    });
  }
};
// @desc    Create a station
// @route   POST /stations
// @access  Private/Admin
const createStation = async (req, res) => {
  try {
    const {
      stationCode,
      name,
      type,
      capacity,
      status,
      pricePerKwh,
      connectors
    }
 = req.body;
    if (!stationCode || !type || pricePerKwh === undefined) {
      return res.status(400).json({
        message: 'stationCode, type, and pricePerKwh are required'
      });
    }
    // Check for duplicate stationCode
    const duplicate = await Station.findOne({
      stationCode
    });
    if (duplicate) {
      return res.status(400).json({
        message: 'Station code already exists'
      });
    }
    const newStation = await Station.create({
      stationCode,
      name,
      type,
      capacity,
      status,
      pricePerKwh,
      connectors
    });
    return res.status(201).json(newStation);
  }  catch (error) {
    console.error('Create station error:', error.message);
    return res.status(500).json({
      message: 'Server error creating station'
    });
  }
};
// @desc    Update a station
// @route   PUT /stations/:id
// @access  Private/Admin
const updateStation = async (req, res) => {
  try {
    const {
      stationCode,
      name,
      type,
      capacity,
      status,
      pricePerKwh,
      connectors
    }
 = req.body;
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    // If stationCode is being updated, check for duplicates
    if (stationCode && stationCode !== station.stationCode) {
      const duplicate = await Station.findOne({
        stationCode
      });
      if (duplicate) {
        return res.status(400).json({
          message: 'Station code already exists'
        });
      }
      station.stationCode = stationCode;
    }
    if (name !== undefined) station.name = name;
    if (type !== undefined) station.type = type;
    if (capacity !== undefined) station.capacity = capacity;
    if (status !== undefined) station.status = status;
    if (pricePerKwh !== undefined) station.pricePerKwh = pricePerKwh;
    if (connectors !== undefined) station.connectors = connectors;
    const updatedStation = await station.save();
    return res.status(200).json(updatedStation);
  }  catch (error) {
    console.error('Update station error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    return res.status(500).json({
      message: 'Server error updating station'
    });
  }
};
// @desc    Delete a station
// @route   DELETE /stations/:id
// @access  Private/Admin
const deleteStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    await Station.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      message: 'Station removed successfully'
    });
  }  catch (error) {
    console.error('Delete station error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    return res.status(500).json({
      message: 'Server error deleting station'
    });
  }
};
module.exports = {
  getAllStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation
};
