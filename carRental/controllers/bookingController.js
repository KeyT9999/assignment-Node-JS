// File: controllers/bookingController.js
// Chức năng: Logic xử lý thuê xe, kiểm tra lịch thuê trùng, hủy lịch thuê và trả xe.

// Import các model cần thiết để truy vấn dữ liệu
const Booking = require("../models/bookingModel");
const Car = require("../models/carModel");

/**
 * @desc    Lấy danh sách tất cả các đơn đặt xe (bookings)
 * @route   GET /bookings
 * @access  Public
 */
const getAllBookings = async (req, res) => {
  try {
    // Tìm tất cả đơn đặt xe và sắp xếp theo thứ tự mới nhất lên đầu (createdAt: -1)
    const bookings = await Booking.find().sort({ createdAt: -1 });
    
    // Trả về danh sách đơn đặt xe thành công
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách booking",
      error: error.message,
    });
  }
};

/**
 * @desc    Xem chi tiết một đơn đặt xe theo ID
 * @route   GET /bookings/:bookingId
 * @access  Public
 */
const getBookingById = async (req, res) => {
  try {
    // Tìm kiếm đơn đặt xe theo ID (MongoDB ObjectId)
    const booking = await Booking.findById(req.params.bookingId);
    
    // Nếu không tìm thấy, trả về lỗi 404
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }
    
    // Trả về dữ liệu đơn đặt xe
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

/**
 * @desc    Tạo mới một đơn đặt thuê xe (Có kiểm tra lịch trùng và tính tổng tiền)
 * @route   POST /bookings
 * @access  Public
 */
const createBooking = async (req, res) => {
  try {
    const { customerName, carNumber, startDate, endDate } = req.body;

    // 1. Kiểm tra xem xe có tồn tại trong hệ thống hay không
    const car = await Car.findOne({ carNumber });
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy xe với biển số: ${carNumber}`,
      });
    }

    // 2. Kiểm tra xem xe có đang ở trạng thái bảo trì (maintenance) hay không
    if (car.status === "maintenance") {
      return res.status(400).json({
        success: false,
        message: "Xe đang bảo trì, không thể đặt",
      });
    }

    // Chuyển đổi định dạng ngày gửi lên thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 3. Đảm bảo ngày kết thúc phải sau ngày bắt đầu
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // 4. KIỂM TRA LỊCH TRÙNG XE (Overlapping Booking):
    // Thuật toán: Một đơn đặt xe mới bị trùng khi và chỉ khi:
    // Đơn đặt xe mới bắt đầu TRƯỚC KHI đơn cũ kết thúc (startDate < end) 
    // VÀ đơn đặt xe mới kết thúc SAU KHI đơn cũ bắt đầu (endDate > start)
    const overlappingBooking = await Booking.findOne({
      carNumber,
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    // Nếu tìm thấy đơn đặt xe khác trùng lịch trong khoảng thời gian này
    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: `Xe ${carNumber} đã được đặt trong khoảng thời gian này`,
        conflictBooking: {
          customerName: overlappingBooking.customerName,
          startDate: overlappingBooking.startDate,
          endDate: overlappingBooking.endDate,
        },
      });
    }

    // 5. TÍNH TOÁN SỐ NGÀY THUÊ VÀ TỔNG TIỀN:
    // (end - start) trả về khoảng cách thời gian dạng mili-giây.
    // Chia cho (1000 * 60 * 60 * 24) để đổi ra số ngày.
    // Sử dụng Math.ceil để làm tròn lên số ngày thuê.
    const numberOfDays = Math.ceil(
      (end - start) / (1000 * 60 * 60 * 24)
    );
    const totalAmount = numberOfDays * car.pricePerDay;

    // 6. Tạo bản ghi Booking mới trong CSDL
    const booking = await Booking.create({
      customerName,
      carNumber,
      startDate: start,
      endDate: end,
      totalAmount,
    });

    // 7. Cập nhật trạng thái của Xe thành "rented" (đã cho thuê)
    await Car.findOneAndUpdate({ carNumber }, { status: "rented" });

    // Trả về thông tin đơn thuê xe thành công kèm hoá đơn chi tiết
    res.status(201).json({
      success: true,
      data: booking,
      paymentDetails: {
        numberOfDays,
        pricePerDay: car.pricePerDay,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi tạo booking",
      error: error.message,
    });
  }
};

/**
 * @desc    Cập nhật thông tin đơn đặt xe theo ID (Cập nhật ngày thuê hoặc đổi xe)
 * @route   PUT /bookings/:bookingId
 * @access  Public
 */
const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { customerName, carNumber, startDate, endDate } = req.body;

    // 1. Tìm đơn đặt xe hiện tại
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Lấy thông tin mới nếu có truyền lên, ngược lại giữ nguyên thông tin cũ
    const newCarNumber = carNumber || existingBooking.carNumber;
    const newStart = startDate
      ? new Date(startDate)
      : existingBooking.startDate;
    const newEnd = endDate ? new Date(endDate) : existingBooking.endDate;

    // 2. Validate thời gian mới hợp lệ
    if (newEnd <= newStart) {
      return res.status(400).json({
        success: false,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
      });
    }

    // 3. Kiểm tra xe mới có tồn tại không
    const car = await Car.findOne({ carNumber: newCarNumber });
    if (!car) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy xe với biển số: ${newCarNumber}`,
      });
    }

    // 4. Kiểm tra trùng lịch của xe mới/ngày mới
    // Loại trừ chính đơn đặt xe hiện tại ra khỏi điều kiện kiểm tra (_id: { $ne: bookingId })
    const overlappingBooking = await Booking.findOne({
      carNumber: newCarNumber,
      _id: { $ne: bookingId },
      startDate: { $lt: newEnd },
      endDate: { $gt: newStart },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        success: false,
        message: `Xe ${newCarNumber} đã được đặt trong khoảng thời gian này`,
      });
    }

    // 5. Tính toán lại số ngày thuê và tổng tiền
    const numberOfDays = Math.ceil(
      (newEnd - newStart) / (1000 * 60 * 60 * 24)
    );
    const totalAmount = numberOfDays * car.pricePerDay;

    // 6. Cập nhật thông tin đơn thuê xe trong DB
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        customerName: customerName || existingBooking.customerName,
        carNumber: newCarNumber,
        startDate: newStart,
        endDate: newEnd,
        totalAmount,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedBooking,
      paymentDetails: {
        numberOfDays,
        pricePerDay: car.pricePerDay,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Lỗi khi cập nhật booking",
      error: error.message,
    });
  }
};

/**
 * @desc    Xóa/Hủy đơn đặt xe theo ID (Tự động cập nhật lại trạng thái xe thành sẵn sàng)
 * @route   DELETE /bookings/:bookingId
 * @access  Public
 */
const deleteBooking = async (req, res) => {
  try {
    // Xóa đơn đặt xe khỏi CSDL
    const booking = await Booking.findByIdAndDelete(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
      });
    }

    // Kiểm tra xem chiếc xe này còn bất kỳ lịch đặt nào khác không
    const remainingBookings = await Booking.countDocuments({
      carNumber: booking.carNumber,
    });

    // Nếu không còn đơn đặt xe nào khác đối với xe này, chuyển trạng thái xe về "available" (Sẵn sàng)
    if (remainingBookings === 0) {
      await Car.findOneAndUpdate(
        { carNumber: booking.carNumber },
        { status: "available" }
      );
    }

    res.status(200).json({
      success: true,
      message: "Đã xóa booking thành công",
      data: booking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa booking",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};
