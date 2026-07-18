/**
 * @file sessionController.js
 * @description Controller điều khiển nghiệp vụ đặt phiên sạc xe điện (Session).
 * Bao gồm các chức năng: Xem danh sách phiên sạc (phân quyền: khách hàng chỉ xem của mình, admin xem tất cả)
 * và Đăng ký phiên sạc mới (kiểm tra xung đột thời gian, tính toán chi phí động, trừ tiền ví điện tử).
 */

const Session = require('../models/sessionModel');
const Station = require('../models/stationModel');
const User = require('../models/userModel');
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');

/**
 * Lấy danh sách các phiên sạc.
 * Khách hàng thường (customer) chỉ được xem các phiên sạc do mình đăng ký.
 * Quản trị viên (admin) được phép xem toàn bộ danh sách phiên sạc trong hệ thống.
 * 
 * @async
 * @function getSessions
 * @param {express.Request} req
 * @param {express.Response} res
 */
const getSessions = async (req, res) => {
  try {
    let query = {};
    
    // RBAC: Áp dụng điều kiện lọc theo userId nếu vai trò là khách hàng
    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }
    
    // Tìm kiếm và tự động nạp (populate) thông tin User liên kết và thông tin trạm sạc
    const sessions = await Session.find(query)
      .populate('userId', 'username role')
      .populate('stationId');
      
    return res.status(200).json(sessions);
  }  catch (error) {
    console.error('Get sessions error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving sessions'
    });
  }
};

/**
 * Tạo/Đặt phiên sạc xe điện mới.
 * Quy trình xử lý nghiệp vụ nghiêm ngặt bao gồm:
 * 1. Kiểm tra tính hợp lệ của thời gian (không ở quá khứ, bắt đầu phải trước kết thúc).
 * 2. Xác thực trạng thái của trạm sạc (không thể đặt nếu trạm sạc đang bảo trì hoặc offline).
 * 3. Kiểm tra xung đột thời gian (Overlap check) với các phiên sạc khác cùng trạm.
 * 4. Tính giá tiền động (Dynamic pricing) theo thời lượng sạc và giờ cao điểm/khung giờ đặc thù.
 * 5. Thanh toán qua Ví điện tử (nếu tính năng ví được kích hoạt: kiểm tra số dư và trừ tiền ví).
 * 6. Khởi tạo bản ghi phiên sạc mới.
 * 
 * @async
 * @function createSession
 * @param {express.Request} req
 * @param {express.Response} res
 */
const createSession = async (req, res) => {
  try {
    const { stationId, startTime, endTime, energyEstimate, note } = req.body;
    
    // Validate dữ liệu đầu vào bắt buộc
    if (!stationId || !startTime || !endTime) {
      return res.status(400).json({
        message: 'stationId, startTime, and endTime are required'
      });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    
    // A. KIỂM TRA THỜI GIAN
    // 1. Thời điểm bắt đầu sạc không được nằm trong quá khứ
    if (start < now) {
      return res.status(400).json({
        message: 'Start time cannot be in the past'
      });
    }
    // 2. Thời điểm bắt đầu sạc phải trước thời điểm kết thúc
    if (start >= end) {
      return res.status(400).json({
        message: 'Start time must be strictly before end time'
      });
    }
    
    // B. KIỂM TRA TRẠM SẠC
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    // Từ chối đăng ký nếu trạng thái trạm sạc không sẵn sàng
    if (station.status === 'maintenance' || station.status === 'offline') {
      return res.status(403).json({
        message: `This station is currently unavailable due to status: ${station.status}`
      });
    }
    
    // C. KIỂM TRA XUNG ĐỘT TRÙNG LỊCH (OVERLAP)
    const conflict = await checkOverlap({
      SessionModel: Session,
      stationId,
      startTime: start,
      endTime: end
    });
    if (conflict) {
      return res.status(409).json({
        message: 'The selected station is already reserved for the requested time period.',
        conflictingSession: conflict
      });
    }
    
    // D. TÍNH TOÁN CHI PHÍ ĐỘNG
    const { hours, totalCost, discountApplied } = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerKwh: station.pricePerKwh
    });
    
    // E. XỬ LÝ THANH TOÁN QUA VÍ ĐIỆN TỬ
    const userId = req.user.id;
    let user = null;
    if (process.env.ENABLE_WALLET === 'true') {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'Authenticated user not found in database'
        });
      }
      
      // Kiểm tra số dư tài khoản
      if (user.balance < totalCost) {
        return res.status(402).json({
          message: `Payment Required: Insufficient wallet balance. Total amount: ${totalCost}, Current balance: ${user.balance}`
        });
      }
      
      // Thực hiện khấu trừ số dư và lưu lại người dùng
      user.balance -= totalCost;
      await user.save();
    }
    
    // F. KHỞI TẠO PHIÊN SẠC
    const newSession = await Session.create({
      userId,
      stationId,
      startTime: start,
      endTime: end,
      energyEstimate: energyEstimate || 1,
      totalCost,
      note,
    });
    
    // Nạp lại thông tin phiên sạc để chuẩn bị phản hồi cho Client
    const populatedSession = await Session.findById(newSession._id)
      .populate('userId', 'username role balance')
      .populate('stationId');
      
    return res.status(201).json({
      message: 'Session created successfully',
      discountApplied,
      hoursCalculated: hours,
      session: populatedSession
    });
  }  catch (error) {
    console.error('Create session error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    return res.status(500).json({
      message: 'Server error creating session'
    });
  }
};

module.exports = {
  getSessions,
  createSession
};

