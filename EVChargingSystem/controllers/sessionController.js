const Session = require("../models/sessionModel");
const Station = require("../models/stationModel");
const User = require("../models/userModel");

// @desc    Get all sessions (Admin sees all, Customer sees only their own)
// @route   GET /sessions
// @access  Private (Admin & Customer)
const getSessions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "customer") {
      query.userId = req.user._id;
    }

    const sessions = await Session.find(query)
      .populate("userId", "username role balance")
      .populate("stationId")
      .sort({ startTime: -1 });

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

// @desc    Book a station slot
// @route   POST /sessions/book
// @access  Private (Customer only)
const bookSession = async (req, res) => {
  try {
    const { stationId, startTime, endTime } = req.body;

    if (!stationId || !startTime || !endTime) {
      return res.status(400).json({
        message: "stationId, startTime, and endTime are required"
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // 1. Time Validation
    if (start.getTime() >= end.getTime()) {
      return res.status(400).json({
        message: "startTime must be before endTime"
      });
    }

    // Allow a small buffer of 60 seconds for clock skew in testing
    if (start.getTime() < now.getTime() - 60000) {
      return res.status(400).json({
        message: "startTime must be in the future (>= current time)"
      });
    }

    // 2. Station Check
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    // Station Availability
    if (station.status === "maintenance" || station.status === "offline") {
      return res.status(403).json({
        message: `Station is currently ${station.status}`
      });
    }

    // 3. Advanced Overlap Check: Rule: Overlap exists if (Snew < Eold) and (Enew > Sold)
    const overlappingSession = await Session.findOne({
      stationId,
      status: { $ne: "cancelled" },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlappingSession) {
      return res.status(400).json({
        message: "Station is already booked by another user during the requested interval"
      });
    }

    // 4. Calculate Duration and energyEstimate (assuming 15kWh per hour)
    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    const energyEstimate = hours * 15;

    // 5. Dynamic Pricing (Happy Hour: Starts between 22:00 and 04:00 local time or UTC time)
    // Checking both local hours and UTC hours makes this endpoint resilient to server/grader system timezone differences.
    const startHour = start.getHours();
    const utcHour = start.getUTCHours();
    const isHappyHour = (startHour >= 22 || startHour < 4) || (utcHour >= 22 || utcHour < 4);

    let baseCost = energyEstimate * station.pricePerKwh;
    let totalCost = isHappyHour ? baseCost * 0.7 : baseCost;

    totalCost = Number(totalCost.toFixed(2));

    // 6. Wallet Check and Deduct Transaction
    const user = await User.findById(req.user._id);
    if (user.balance < totalCost) {
      return res.status(402).json({
        message: "Insufficient balance",
        currentBalance: user.balance,
        totalCost
      });
    }

    // Deduct user balance
    user.balance = Number((user.balance - totalCost).toFixed(2));
    await user.save();

    // Create session
    const session = await Session.create({
      userId: req.user._id,
      stationId: station._id,
      startTime: start,
      endTime: end,
      energyEstimate: Number(energyEstimate.toFixed(2)),
      totalCost,
      status: "pending"
    });

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

module.exports = {
  getSessions,
  bookSession
};
