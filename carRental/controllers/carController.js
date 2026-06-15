// File: controllers/carController.js
// Chức năng: Logic xử lý API lấy thông tin danh sách xe và thêm xe mới.

// Import model Car từ thư mục models
const Car = require("../models/carModel");

/**
 * @desc    Lấy danh sách tất cả xe ô tô trong hệ thống
 * @route   GET /cars
 * @access  Public
 */
const getAllCars = async (req, res) => {
  try {
    // Truy vấn toàn bộ danh sách xe từ collection cars
    const cars = await Car.find();
    
    // Phản hồi thành công với mã 200 (OK)
    res.status(200).json({
      success: true,
      count: cars.length, // Trả về số lượng xe
      data: cars,         // Mảng danh sách xe
    });
  } catch (error) {
    // Xử lý lỗi server
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách xe",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy chi tiết thông tin xe theo Biển số xe
 * @route   GET /cars/:carNumber
 * @access  Public
 */
const getCarByNumber = async (req, res) => {
  try {
    // Tìm kiếm xe có trường carNumber khớp với param trên URL
    const car = await Car.findOne({ carNumber: req.params.carNumber });
    
    // Nếu không tìm thấy xe, trả về lỗi 404
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy xe với biển số: ${req.params.carNumber}`,
      });
    }
    
    // Trả về thông tin chi tiết của xe với mã 200
    res.status(200).json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * @desc    Tạo mới một chiếc xe đưa vào hệ thống
 * @route   POST /cars
 * @access  Public
 */
const createCar = async (req, res) => {
  try {
    // Thêm bản ghi mới dựa trên dữ liệu gửi lên (req.body)
    const car = await Car.create(req.body);
    
    // Trả về dữ liệu xe vừa tạo với mã 210 (Created)
    res.status(201).json({ success: true, data: car });
  } catch (error) {
    // Lỗi 400 xảy ra khi validate dữ liệu thất bại (ví dụ trùng biển số xe, thiếu trường bắt buộc)
    res.status(400).json({
      success: false,
      message: "Lỗi khi tạo xe mới",
      error: error.message,
    });
  }
};

/**
 * @desc    Cập nhật thông tin xe theo Biển số xe
 * @route   PUT /cars/:carNumber
 * @access  Public
 */
const updateCar = async (req, res) => {
  try {
    // Tìm kiếm xe theo biển số và tiến hành cập nhật dữ liệu mới
    const car = await Car.findOneAndUpdate(
      { carNumber: req.params.carNumber }, // Điều kiện tìm kiếm
      req.body,                            // Dữ liệu cần cập nhật
      { 
        new: true,         // Yêu cầu trả về bản ghi sau khi đã sửa thay vì bản cũ
        runValidators: true // Chạy lại các validation định nghĩa trong Schema
      }
    );
    
    // Nếu không tìm thấy xe để cập nhật, trả về lỗi 404
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy xe với biển số: ${req.params.carNumber}`,
      });
    }
    
    // Phản hồi cập nhật thành công với mã 200
    res.status(200).json({ success: true, data: car });
  } catch (error) {
    // Trả về lỗi 400 nếu dữ liệu cập nhật không hợp lệ
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật xe",
      error: error.message,
    });
  }
};

/**
 * @desc    Xóa xe khỏi hệ thống theo Biển số xe
 * @route   DELETE /cars/:carNumber
 * @access  Public
 */
const deleteCar = async (req, res) => {
  try {
    // Tìm và xóa xe theo biển số xe
    const car = await Car.findOneAndDelete({
      carNumber: req.params.carNumber,
    });
    
    // Trả về lỗi 404 nếu không tìm thấy xe để xóa
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy xe với biển số: ${req.params.carNumber}`,
      });
    }
    
    // Phản hồi xóa thành công và trả về thông tin xe vừa bị xóa
    res.status(200).json({
      success: true,
      message: "Đã xóa xe thành công",
      data: car,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa xe",
      error: error.message,
    });
  }
};

/**
 * @desc    Lấy danh sách xe còn trống trong khoảng thời gian từ startDate đến endDate
 * @route   GET /cars/available?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @access  Public
 */
const getAvailableCars = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // 1. Kiểm tra sự tồn tại của query params
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp startDate và endDate (dạng YYYY-MM-DD)",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 2. Kiểm tra ngày hợp lệ
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Ngày tháng không hợp lệ. Định dạng: YYYY-MM-DD",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // 3. Tìm tất cả các xe bị trùng lịch trong khoảng thời gian yêu cầu
    const Booking = require("../models/bookingModel");
    const overlappingBookings = await Booking.find({
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    // Tạo tập hợp các biển số xe đã có lịch đặt trùng
    const bookedCarNumbers = overlappingBookings.map((b) => b.carNumber);

    // 4. Tìm các xe:
    //    - Không nằm trong danh sách xe đã được đặt
    //    - Không ở trạng thái "maintenance"
    const availableCars = await Car.find({
      carNumber: { $nin: bookedCarNumbers },
      status: { $ne: "maintenance" },
    });

    res.status(200).json({
      success: true,
      count: availableCars.length,
      data: availableCars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi kiểm tra xe có sẵn",
      error: error.message,
    });
  }
};

// Xuất các phương thức ra ngoài để định tuyến sử dụng
module.exports = {
  getAllCars,
  getCarByNumber,
  createCar,
  updateCar,
  deleteCar,
  getAvailableCars,
};
