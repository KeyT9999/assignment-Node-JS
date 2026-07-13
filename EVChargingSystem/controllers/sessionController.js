const Session = require("../models/sessionModel");
const Station = require("../models/stationModel");
const User = require("../models/userModel");

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

    if (start.getTime() >= end.getTime()) {
      return res.status(400).json({
        message: "startTime must be before endTime"
      });
    }

    if (start.getTime() < now.getTime() - 60000) {
      return res.status(400).json({
        message: "startTime must be in the future (>= current time)"
      });
    }

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    if (station.status === "maintenance" || station.status === "offline") {
      return res.status(403).json({
        message: `Station is currently ${station.status}`
      });
    }

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

    const durationMs = end.getTime() - start.getTime();
    const hours = durationMs / (1000 * 60 * 60);
    const energyEstimate = hours * 15;

    const startHour = start.getHours();
    const utcHour = start.getUTCHours();
    const isHappyHour = (startHour >= 22 || startHour < 4) || (utcHour >= 22 || utcHour < 4);

    let baseCost = energyEstimate * station.pricePerKwh;
    let totalCost = isHappyHour ? baseCost * 0.7 : baseCost;
    totalCost = Number(totalCost.toFixed(2));

    const user = await User.findById(req.user._id);
    if (user.balance < totalCost) {
      return res.status(402).json({
        message: "Insufficient balance",
        currentBalance: user.balance,
        totalCost
      });
    }

    user.balance = Number((user.balance - totalCost).toFixed(2));
    await user.save();

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

const cancelSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only cancel your own sessions"
      });
    }

    if (session.status !== "pending") {
      return res.status(400).json({
        message: `Cannot cancel session with status "${session.status}". Only pending sessions can be cancelled.`
      });
    }

    const now = new Date();
    const start = new Date(session.startTime);

    if (start.getTime() <= now.getTime()) {
      return res.status(400).json({
        message: "Cannot cancel a session that has already started or passed"
      });
    }

    const diffMs = start.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let refundPercentage;
    if (diffHours >= 2) {
      refundPercentage = 1.0;
    } else {
      refundPercentage = 0.7;
    }

    const refundAmount = Number((session.totalCost * refundPercentage).toFixed(2));

    const user = await User.findById(req.user._id);
    user.balance = Number((user.balance + refundAmount).toFixed(2));
    await user.save();

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

const extendSession = async (req, res) => {
  try {
    const { newEndTime } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        message: "Session not found"
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only extend your own sessions"
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        message: `Cannot extend session with status "${session.status}". Only active sessions can be extended.`
      });
    }

    if (!newEndTime) {
      return res.status(400).json({
        message: "newEndTime is required"
      });
    }

    const newEnd = new Date(newEndTime);
    if (isNaN(newEnd.getTime())) {
      return res.status(400).json({
        message: "Invalid newEndTime date format"
      });
    }

    const currentEnd = new Date(session.endTime);
    if (newEnd.getTime() <= currentEnd.getTime()) {
      return res.status(400).json({
        message: "newEndTime must be greater than current endTime"
      });
    }

    const start = new Date(session.startTime);

    const overlappingSession = await Session.findOne({
      stationId: session.stationId,
      _id: { $ne: session._id },
      status: { $ne: "cancelled" },
      startTime: { $lt: newEnd },
      endTime: { $gt: start }
    });

    if (overlappingSession) {
      return res.status(409).json({
        message: "Station is already booked by another session during the extended interval"
      });
    }

    const station = await Station.findById(session.stationId);
    if (!station) {
      return res.status(404).json({
        message: "Station not found"
      });
    }

    const extraMs = newEnd.getTime() - currentEnd.getTime();
    const extraHours = extraMs / (1000 * 60 * 60);
    const extraEnergy = extraHours * 15;

    const startHour = start.getHours();
    const utcHour = start.getUTCHours();
    const isHappyHour = (startHour >= 22 || startHour < 4) || (utcHour >= 22 || utcHour < 4);

    let extraBaseCost = extraEnergy * station.pricePerKwh;
    let extraCost = isHappyHour ? extraBaseCost * 0.7 : extraBaseCost;
    extraCost = Number(extraCost.toFixed(2));

    const user = await User.findById(req.user._id);
    if (user.balance < extraCost) {
      return res.status(402).json({
        message: "Insufficient balance to extend session",
        extraCost,
        currentBalance: user.balance
      });
    }

    user.balance = Number((user.balance - extraCost).toFixed(2));
    await user.save();

    const newDurationMs = newEnd.getTime() - start.getTime();
    const hoursUpdated = newDurationMs / (1000 * 60 * 60);
    const newEnergyEstimate = Number((hoursUpdated * 15).toFixed(2));
    const newTotalCost = Number((session.totalCost + extraCost).toFixed(2));

    session.endTime = newEnd;
    session.energyEstimate = newEnergyEstimate;
    session.totalCost = newTotalCost;
    await session.save();

    res.status(200).json({
      message: "Session extended successfully",
      session,
      billing: {
        extraHours: Number(extraHours.toFixed(2)),
        extraEnergy: Number(extraEnergy.toFixed(2)),
        extraCost,
        hoursUpdated: Number(hoursUpdated.toFixed(2)),
        totalCost: newTotalCost,
        remainingBalance: user.balance
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Extend session failed",
      error: error.message
    });
  }
};

const getOverdueSessions = async (req, res) => {
  try {
    const now = new Date();
    const overdueSessions = await Session.find({
      status: "pending",
      startTime: { $lte: now }
    })
    .populate("userId", "username role balance phoneNumber")
    .populate("stationId")
    .sort({ startTime: 1 });

    const results = overdueSessions.map(session => {
      const lateMs = now.getTime() - new Date(session.startTime).getTime();
      const lateMinutes = Math.round(lateMs / (1000 * 60));
      return {
        _id: session._id,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        energyEstimate: session.energyEstimate,
        totalCost: session.totalCost,
        lateMinutes,
        user: session.userId ? {
          id: session.userId._id,
          username: session.userId.username,
          phoneNumber: session.userId.phoneNumber || "Chưa cập nhật số điện thoại"
        } : null,
        station: session.stationId ? {
          id: session.stationId._id,
          stationCode: session.stationId.stationCode,
          type: session.stationId.type,
          pricePerKwh: session.stationId.pricePerKwh
        } : null
      };
    });

    res.status(200).json({
      message: "Get overdue sessions successfully",
      count: results.length,
      sessions: results
    });
  } catch (error) {
    res.status(500).json({
      message: "Get overdue sessions failed",
      error: error.message
    });
  }
};

module.exports = {
  getSessions,
  bookSession,
  cancelSession,
  extendSession,
  getOverdueSessions
};
