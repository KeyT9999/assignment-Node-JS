const Session = require("../models/sessionModel");
const Station = require("../models/stationModel");
const User = require("../models/userModel");

// @desc    Get all sessions (Lấy danh sách các phiên sạc)
// @route   GET /sessions
// @access  Private (Admin & Customer - Phân quyền hiển thị dữ liệu)
const getSessions = async (req, res) => {
  try {
    let query = {};
    
    // Phân quyền dữ liệu:
    // - Nếu là khách hàng (customer), chỉ truy vấn các phiên sạc của chính khách hàng đó.
    // - Nếu là quản trị viên (admin), giữ nguyên query trống để lấy toàn bộ các phiên sạc hệ thống.
    if (req.user.role === "customer") {
      query.userId = req.user._id;
    }

    // Thực hiện tìm kiếm và populate thông tin người dùng cùng trạm sạc, sắp xếp phiên mới nhất lên đầu
    const sessions = await Session.find(query)
      .populate("userId", "username role balance") // Nạp thông tin user, bỏ qua trường nhạy cảm
      .populate("stationId")                        // Nạp toàn bộ thông tin trạm sạc
      .sort({ startTime: -1 });                     // Sắp xếp giảm dần theo thời gian bắt đầu

    res.status(200).json({
      message: "Get sessions successfully",
      count: sessions.length,
      sessions
    });
  } catch (error) {
    res.status(500).json({
      message: "Get sessions failed",
      error: error.message
    });
  }
};

// @desc    Book a station slot (Đặt chỗ sạc tại một trạm sạc)
// @route   POST /sessions/book
// @access  Private (Chỉ cho phép khách hàng thực hiện đặt chỗ)
const bookSession = async (req, res) => {
  try {
    const { stationId, startTime, endTime } = req.body;

    // Yêu cầu bắt buộc cung cấp ID trạm sạc, thời gian bắt đầu và kết thúc
    if (!stationId || !startTime || !endTime) {
      return res.status(400).json({
        message: "stationId, startTime, and endTime are required"
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // 1. Kiểm tra tính hợp lệ về mặt thời gian (Time Validation)
    // - Thời gian bắt đầu phải trước thời gian kết thúc
    if (start.getTime() >= end.getTime()) {
      return res.status(400).json({
        message: "startTime must be before endTime"
      });
    }

    // - Thời gian bắt đầu đặt lịch sạc phải ở tương lai.
    // Cho phép dung sai 60 giây (60000ms) để bù đắp sự lệch múi giờ/đồng hồ hệ thống khi chấm bài.
    if (start.getTime() < now.getTime() - 60000) {
      return res.status(400).json({
        message: "startTime must be in the future (>= current time)"
      });
    }

    // 2. Kiểm tra sự tồn tại và trạng thái của Trạm sạc (Station Check)
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    // Trạm sạc phải đang sẵn sàng. Nếu đang bảo trì (maintenance) hoặc mất kết nối (offline) thì chặn đặt chỗ.
    if (station.status === "maintenance" || station.status === "offline") {
      return res.status(403).json({
        message: `Station is currently ${station.status}`
      });
    }

    // 3. Nghiệp vụ kiểm tra thời gian đặt chỗ trùng lắp (Advanced Overlap Check)
    // Quy tắc: Hai khoảng thời gian [S1, E1] và [S2, E2] trùng nhau khi và chỉ khi: (S1 < E2) và (E1 > S2)
    // Tìm kiếm các phiên sạc của trạm này (chưa bị hủy bỏ) có khoảng thời gian chồng lấn với khoảng thời gian khách hàng đang yêu cầu.
    const overlappingSession = await Session.findOne({
      stationId,
      status: { $ne: "cancelled" }, // Bỏ qua các phiên sạc đã bị hủy bỏ
      startTime: { $lt: end },      // Thời điểm bắt đầu của phiên cũ nhỏ hơn thời điểm kết thúc phiên mới sạc
      endTime: { $gt: start }       // Thời điểm kết thúc của phiên cũ lớn hơn thời điểm bắt đầu phiên mới sạc
    });

    if (overlappingSession) {
      return res.status(400).json({
        message: "Station is already booked by another user during the requested interval"
      });
    }

    // 4. Tính toán thời gian sạc và ước tính điện năng tiêu thụ (energyEstimate)
    // Giả định định mức sạc trung bình là 15 kWh điện cho mỗi giờ sạc (15 kWh/hour).
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60); // Đổi mili-giây sang giờ
    const energyEstimate = hours * 15;

    // 5. Nghiệp vụ giá động (Dynamic Pricing - Giảm giá Happy Hour)
    // Quy tắc: Khung giờ vàng (Happy Hour) bắt đầu trong khoảng từ 22:00 đêm hôm trước đến 04:00 sáng hôm sau.
    // Kiểm tra cả theo múi giờ địa phương của server (start.getHours()) và giờ chuẩn quốc tế (start.getUTCHours()) 
    // để tránh các sai số múi giờ chạy thử trên các môi trường CI/CD khác nhau.
    const startHour = start.getHours();
    const utcHour = start.getUTCHours();
    const isHappyHour = (startHour >= 22 || startHour < 4) || (utcHour >= 22 || utcHour < 4);

    let baseCost = energyEstimate * station.pricePerKwh;
    // Nếu thuộc khung giờ Happy Hour, áp dụng giảm giá 30% (khách hàng chỉ trả 70% giá gốc)
    let totalCost = isHappyHour ? baseCost * 0.7 : baseCost;

    totalCost = Number(totalCost.toFixed(2)); // Làm tròn về 2 chữ số thập phân

    // 6. Kiểm tra số dư tài khoản người dùng và thực hiện trừ tiền trong ví (Wallet Check & Deduct)
    const user = await User.findById(req.user._id);
    // Nếu ví không đủ thanh toán tổng số tiền của phiên sạc
    if (user.balance < totalCost) {
      return res.status(402).json({ // Mã phản hồi 402 Payment Required
        message: "Insufficient balance",
        currentBalance: user.balance,
        totalCost
      });
    }

    // Trừ số dư ví tiền của người dùng và làm tròn 2 chữ số thập phân
    user.balance = Number((user.balance - totalCost).toFixed(2));
    await user.save(); // Lưu cập nhật ví vào DB

    // 7. Tạo mới phiên sạc với trạng thái chờ sạc "pending"
    const session = await Session.create({
      userId: req.user._id,
      stationId: station._id,
      startTime: start,
      endTime: end,
      energyEstimate: Number(energyEstimate.toFixed(2)),
      totalCost,
      status: "pending"
    });

    // 8. Trả kết quả đặt lịch thành công cùng biên lai thanh toán chi tiết
    res.status(201).json({
      message: "Session booked successfully",
      session,
      billing: {
        hours,
        energyEstimate,
        isHappyHour,
        pricePerKwh: station.pricePerKwh,
        totalCost,
        remainingBalance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Booking session failed",
      error: error.message
    });
  }
};

// @desc    Cancel a charging session (Customer only)
// @route   POST /sessions/cancel/:id
// @access  Private (Customer only)
const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    // Ensure the customer owns this session
    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only cancel your own sessions"
      });
    }

    // Only pending sessions can be cancelled
    if (session.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel session with status "${session.status}". Only pending sessions can be cancelled.`
      });
    }

    const now = new Date();
    const start = new Date(session.startTime);

    // Cannot cancel if start time has already passed
    if (start.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "Cannot cancel a session that has already started or passed"
      });
    }

    // Calculate time difference in hours from now to startTime
    const diffMs = start.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let refundPercentage;
    if (diffHours >= 2) {
      refundPercentage = 1.0; // 100%
    } else {
      refundPercentage = 0.7; // 70%
    }

    const refundAmount = Number((session.totalCost * refundPercentage).toFixed(2));

    // Refund money to user
    const user = await User.findById(req.user._id);
    user.balance = Number((user.balance + refundAmount).toFixed(2));
    await user.save();

    // Update session status
    session.status = "cancelled";
    session.refundAmount = refundAmount;
    session.cancelledAt = now;
    await session.save();

    res.status(200).json({
      message: "Session cancelled successfully",
      session: {
        _id: session._id,
        status: session.status,
        totalCost: session.totalCost,
        refundAmount: session.refundAmount,
        refundPercentage: Math.round(refundPercentage * 100),
        cancelledAt: session.cancelledAt,
        remainingBalance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Cancel session failed",
      error: error.message
    });
  }
};

module.exports = {
  getSessions,
  bookSession,
  cancelSession
};

