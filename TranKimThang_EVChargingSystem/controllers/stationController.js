/**
 * @file stationController.js
 * @description Controller xử lý các yêu cầu CRUD (Tạo, Đọc, Cập nhật, Xóa) liên quan đến trạm sạc xe điện (Station).
 * Hầu hết các thao tác ghi dữ liệu (Tạo, Sửa, Xóa) yêu cầu quyền Quản trị viên (admin).
 */

const Station = require('../models/stationModel');

/**
 * Lấy danh sách tất cả các trạm sạc xe điện hiện có.
 * 
 * @async
 * @function getAllStations
 * @param {express.Request} req
 * @param {express.Response} res
 */
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

/**
 * Lấy chi tiết một trạm sạc xe điện dựa trên ID.
 * 
 * @async
 * @function getStationById
 * @param {express.Request} req
 * @param {express.Response} res
 */
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
    // Xử lý trường hợp ID truyền sai định dạng ObjectId của MongoDB
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

/**
 * Tạo một trạm sạc mới.
 * Kiểm tra các trường dữ liệu bắt buộc và đảm bảo mã trạm sạc (stationCode) không bị trùng lặp.
 * Yêu cầu quyền: Quản trị viên (admin).
 * 
 * @async
 * @function createStation
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createStation = async (req, res) => {
  try {
    const { stationCode, name, type, capacity, status, pricePerKwh, connectors } = req.body;
    
    // Kiểm tra dữ liệu đầu vào bắt buộc
    if (!stationCode || !type || pricePerKwh === undefined) {
      return res.status(400).json({
        message: 'stationCode, type, and pricePerKwh are required'
      });
    }
    
    // Đảm bảo không trùng mã trạm sạc trong hệ thống
    const duplicate = await Station.findOne({ stationCode });
    if (duplicate) {
      return res.status(400).json({
        message: 'Station code already exists'
      });
    }
    
    // Lưu trạm sạc mới
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

/**
 * Cập nhật thông tin trạm sạc theo ID.
 * Kiểm tra tính trùng lặp của mã trạm sạc nếu được thay đổi.
 * Yêu cầu quyền: Quản trị viên (admin).
 * 
 * @async
 * @function updateStation
 * @param {express.Request} req
 * @param {express.Response} res
 */
const updateStation = async (req, res) => {
  try {
    const { stationCode, name, type, capacity, status, pricePerKwh, connectors } = req.body;
    
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    
    // Nếu thay đổi mã trạm sạc, kiểm tra xem mã mới có trùng với trạm sạc khác không
    if (stationCode && stationCode !== station.stationCode) {
      const duplicate = await Station.findOne({ stationCode });
      if (duplicate) {
        return res.status(400).json({
          message: 'Station code already exists'
        });
      }
      station.stationCode = stationCode;
    }
    
    // Cập nhật các trường thông tin nếu có truyền lên
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

/**
 * Xóa một trạm sạc khỏi hệ thống theo ID.
 * Yêu cầu quyền: Quản trị viên (admin).
 * 
 * @async
 * @function deleteStation
 * @param {express.Request} req
 * @param {express.Response} res
 */
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

