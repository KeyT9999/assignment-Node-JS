// Nhập các model dữ liệu cần dùng
const Reservation = require('../models/reservationModel');
const Space = require('../models/spaceModel');
const User = require('../models/userModel');
// Nhập các hàm tiện ích hỗ trợ tính tiền và kiểm tra trùng lịch
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');

/**
 * Lấy danh sách các đơn đặt chỗ (Reservations).
 * GET /reservations
 * - Đối với khách hàng (customer): Chỉ lấy các đơn đặt chỗ của chính họ.
 * - Đối với quản trị viên (admin): Lấy toàn bộ đơn đặt chỗ trong hệ thống.
 */
const getReservations = async (req, res) => {
  try {
    let query = {};

    // Nếu người dùng đăng nhập là 'customer', lọc danh sách theo ID người dùng của họ
    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }

    // Truy vấn dữ liệu đặt chỗ và điền thêm thông tin chi tiết (populate) từ bảng User và Space
    const bookings = await Reservation.find(query)
      .populate('userId', 'username role')
      .populate('spaceId');

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

/**
 * Tạo mới đơn đặt chỗ (Reservation).
 * POST /reservations
 */
const createReservation = async (req, res) => {
  try {
    const { spaceId, startTime, endTime, note } = req.body;

    // Kiểm tra dữ liệu đầu vào bắt buộc
    if (!spaceId || !startTime || !endTime) {
      return res.status(400).json({ message: 'spaceId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // Ràng buộc 1: Thời gian bắt đầu đặt chỗ không được ở trong quá khứ
    if (start < now) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    // Ràng buộc 2: Thời gian bắt đầu phải trước thời gian kết thúc
    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be strictly before end time' });
    }

    // Tìm kiếm thông tin không gian được đặt để kiểm tra trạng thái và giá cả
    const resource = await Space.findById(spaceId);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    // Ràng buộc 3: Không gian không được đang bảo trì (maintenance) hoặc ngoại tuyến (offline)
    if (resource.status === 'maintenance' || resource.status === 'offline') {
      return res.status(403).json({
        message: `This resource is currently unavailable due to status: ${resource.status}`
      });
    }

    // Ràng buộc 4: Kiểm tra xem không gian này đã bị ai khác đặt trùng vào khung giờ này chưa
    const conflict = await checkOverlap({
      spaceId,
      startTime: start,
      endTime: end
    });

    if (conflict) {
      return res.status(409).json({
        message: 'The selected resource is already reserved for the requested time period.',
        conflictingReservation: conflict
      });
    }

    // Tính toán chi phí đặt chỗ (bao gồm cả số giờ sạc/thuê và Happy Hour chiết khấu)
    const { hours, totalAmount, discountApplied } = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerUnit: resource.pricePerHour
    });

    const userId = req.user.id;
    let user = null;

    // Nếu hệ thống bật chức năng Ví điện tử (ENABLE_WALLET = true)
    if (process.env.ENABLE_WALLET === 'true') {
      // Tìm thông tin khách hàng đang đặt chỗ
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Authenticated user not found in database' });
      }

      // Kiểm tra số dư ví xem có đủ thanh toán tổng tiền đặt phòng hay không
      if (user.balance < totalAmount) {
        return res.status(402).json({
          message: `Payment Required: Insufficient wallet balance. Total amount: ${totalAmount}, Current balance: ${user.balance}`
        });
      }

      // Khấu trừ số tiền đặt chỗ khỏi ví điện tử của khách hàng và lưu lại
      user.balance -= totalAmount;
      await user.save();
    }

    // Tạo bản ghi đặt chỗ mới
    const newReservation = await Reservation.create({
      userId,
      spaceId,
      startTime: start,
      endTime: end,
      totalAmount,
      note,
      status: 'pending' // Mặc định trạng thái là 'pending'
    });

    // Lấy thông tin bản ghi vừa tạo kèm các thông tin liên quan đã populate để phản hồi lại client
    const populatedReservation = await Reservation.findById(newReservation._id)
      .populate('userId', 'username role balance')
      .populate('spaceId');

    return res.status(201).json({
      message: 'Reservation created successfully',
      discountApplied,
      hoursCalculated: hours,
      booking: populatedReservation
    });

  } catch (error) {
    console.error('Create booking error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Space not found' });
    }
    return res.status(500).json({ message: 'Server error creating booking' });
  }
};

module.exports = {
  getReservations,
  createReservation
};
