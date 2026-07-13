const Station = require("../models/stationModel");

const createStation = async (req, res) => {
  try {
    const { stationCode, type, status, pricePerKwh, connectors } = req.body;

    const station = await Station.create({
      stationCode,
      type,
      status,
      pricePerKwh,
      connectors
    });

    res.status(201).json({
      message: "Station created successfully",
      station
    });
  } catch (error) {
    res.status(500).json({
      message: "Create station failed",
      error: error.message
    });
  }
};

const getStations = async (req, res) => {
  try {
    const stations = await Station.find();

    res.status(200).json({
      message: "Get stations successfully",
      count: stations.length,
      stations
    });
  } catch (error) {
    res.status(500).json({
      message: "Get stations failed",
      error: error.message
    });
  }
};

const getAvailableStations = async (req, res) => {
  try {
    const stations = await Station.find({
      status: "available",
      isOccupied: false
    });

    res.status(200).json({
      message: "Get available stations successfully",
      count: stations.length,
      stations
    });
  } catch (error) {
    res.status(500).json({
      message: "Get available stations failed",
      error: error.message
    });
  }
};

const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    res.status(200).json({
      message: "Get station successfully",
      station
    });
  } catch (error) {
    res.status(500).json({
      message: "Get station failed",
      error: error.message
    });
  }
};

const updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    res.status(200).json({
      message: "Station updated successfully",
      station
    });
  } catch (error) {
    res.status(500).json({
      message: "Update station failed",
      error: error.message
    });
  }
};

const deleteStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    if (station.isOccupied) {
      return res.status(400).json({
        message: "Cannot delete occupied station"
      });
    }

    await station.deleteOne();

    res.status(200).json({
      message: "Station deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete station failed",
      error: error.message
    });
  }
};

module.exports = {
  createStation,
  getStations,
  getAvailableStations,
  getStationById,
  updateStation,
  deleteStation
};
