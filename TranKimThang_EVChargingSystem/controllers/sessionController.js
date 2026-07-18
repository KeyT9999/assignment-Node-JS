const Session = require('../models/sessionModel');
const Station = require('../models/stationModel');
const User = require('../models/userModel');
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');
// @desc    Get sessions
// @route   GET /sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    let query = {
    };
    // RBAC: Customers can only see their own sessions, Admins see all
    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }
    const sessions = await Session.find(query)       .populate('userId', 'username role')       .populate('stationId');
    return res.status(200).json(sessions);
  }  catch (error) {
    console.error('Get sessions error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving sessions'
    });
  }
};
// @desc    Create a session
// @route   POST /sessions (also aliased as POST /sessions/book)
// @access  Private (Admin or Customer)
const createSession = async (req, res) => {
  try {
    const {
      stationId,
      startTime,
      endTime,
      energyEstimate,
      note
    }
 = req.body;
    // Validate request body
    if (!stationId || !startTime || !endTime) {
      return res.status(400).json({
        message: 'stationId, startTime, and endTime are required'
      });
    }
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    // A. Time validation
    // 1. Check if startTime is after or equal to current time
    if (start < now) {
      return res.status(400).json({
        message: 'Start time cannot be in the past'
      });
    }
    // 2. Check if startTime is before endTime
    if (start >= end) {
      return res.status(400).json({
        message: 'Start time must be strictly before end time'
      });
    }
    // B. Station availability check
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({
        message: 'Station not found'
      });
    }
    // Reject if station status is maintenance or offline
    if (station.status === 'maintenance' || station.status === 'offline') {
      return res.status(403).json({
        message: `This station is currently unavailable due to status: ${station.status}`
      });
    }
    // C. Overlap conflict check
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
    // D. Dynamic price calculation
    const {
      hours,
      totalCost,
      discountApplied
    }
 = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerKwh: station.pricePerKwh
    });
    // E. Wallet payment mode validation & processing
    const userId = req.user.id;
    let user = null;
    if (process.env.ENABLE_WALLET === 'true') {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'Authenticated user not found in database'
        });
      }
      if (user.balance < totalCost) {
        return res.status(402).json({
          message: `Payment Required: Insufficient wallet balance. Total amount: ${totalCost}, Current balance: ${user.balance}`
        });
      }
      // Deduct balance and save user
      user.balance -= totalCost;
      await user.save();
    }
    // F. Create session
    const newSession = await Session.create({
      userId,
      stationId,
      startTime: start,
      endTime: end,
      energyEstimate: energyEstimate || 1,
      totalCost,
      note,
    });
    // Fetch and populate station info for response
    const populatedSession = await Session.findById(newSession._id)       .populate('userId', 'username role balance')       .populate('stationId');
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
