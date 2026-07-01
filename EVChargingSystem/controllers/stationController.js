const Station = require("../models/stationModel");

// @desc    Create a new station (Tạo trạm sạc mới)
// @route   POST /stations
// @access  Private/Admin (Chỉ quản trị viên mới được phép thực hiện)
const createStation = async (req, res) => {
  try {
    const { stationCode, type, status, pricePerKwh, connectors } = req.body;

    // Tiến hành khởi tạo trạm sạc mới từ thông tin gửi lên của Admin
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

// @desc    Get all stations (Lấy danh sách toàn bộ trạm sạc)
// @route   GET /stations
// @access  Private (Admin & Customer đều xem được)
const getStations = async (req, res) => {
  try {
    // Truy vấn tất cả trạm sạc không kèm điều kiện lọc nào
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

// @desc    Get available stations (Lấy danh sách các trạm sạc đang rảnh và sẵn sàng hoạt động)
// @route   GET /stations/available
// @access  Private (Admin & Customer)
const getAvailableStations = async (req, res) => {
  try {
    // Điều kiện lọc:
    // - status phải là "available" (không bảo trì, không offline)
    // - isOccupied phải là false (không có xe khác đang cắm sạc)
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

// @desc    Get station by ID (Lấy thông tin chi tiết của một trạm sạc cụ thể)
// @route   GET /stations/:id
// @access  Private (Admin & Customer)
const getStationById = async (req, res) => {
  try {
    // Tìm kiếm trạm sạc theo mã định danh ObjectId của MongoDB
    const station = await Station.findById(req.params.id);

    // Nếu không tìm thấy trạm sạc nào trùng khớp với ID truyền vào
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

// @desc    Update station (Cập nhật thông tin trạm sạc)
// @route   PUT /stations/:id
// @access  Private/Admin (Chỉ admin có quyền)
const updateStation = async (req, res) => {
  try {
    // Tìm và cập nhật bản ghi trạm sạc theo ID
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      req.body, // Dữ liệu cập nhật nhận được từ body
      {
        new: true,           // Trả về tài liệu trạm sạc sau khi đã chỉnh sửa (thay vì bản cũ trước khi sửa)
        runValidators: true  // Chạy các ràng buộc dữ liệu (Validation) được định nghĩa trong Model
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

// @desc    Delete station (Xóa một trạm sạc khỏi hệ thống)
// @route   DELETE /stations/:id
// @access  Private/Admin (Chỉ admin có quyền)
const deleteStation = async (req, res) => {
  try {
    // 1. Tìm thông tin trạm sạc cần xóa
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    // 2. Nghiệp vụ: Trạm sạc đang có xe sử dụng (isOccupied: true) thì KHÔNG được phép xóa
    if (station.isOccupied) {
      return res.status(400).json({
        message: "Cannot delete occupied station" // Trả về mã lỗi 400 Bad Request
      });
    }

    // 3. Thực hiện xóa bản ghi trạm sạc khỏi MongoDB
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

