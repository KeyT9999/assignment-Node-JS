const Reservation = require('../models/reservationModel');
const Space = require('../models/spaceModel');
const User = require('../models/userModel');
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');
// @desc    Get reservations
// @route   GET /reservations
// @access  Private
const getReservations = async (req, res) => {
  try {
    let query = {
    };
    // RBAC: Customers can only see their own reservations, Admins see all
    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }
    const reservations = await Reservation.find(query)       .populate('userId', 'username role')       .populate('spaceId');
    return res.status(200).json(reservations);
  }  catch (error) {
    console.error('Get reservations error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving reservations'
    });
  }
};
// @desc    Create a reservation
// @route   POST /reservations (also aliased as POST /reservations/book)
// @access  Private (Admin or Customer)
const createReservation = async (req, res) => {
  try {
    const {
      spaceId,
      startTime,
      endTime,
      note
    }
 = req.body;
    // Validate request body
    if (!spaceId || !startTime || !endTime) {
      return res.status(400).json({
        message: 'spaceId, startTime, and endTime are required'
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
    // B. Space availability check
    const space = await Space.findById(spaceId);
    if (!space) {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    // Reject if space status is maintenance or offline
    if (space.status === 'maintenance' || space.status === 'offline') {
      return res.status(403).json({
        message: `This space is currently unavailable due to status: ${space.status}`
      });
    }
    // C. Overlap conflict check
    const conflict = await checkOverlap({
      ReservationModel: Reservation,
      spaceId,
      startTime: start,
      endTime: end
    });
    if (conflict) {
      return res.status(409).json({
        message: 'The selected space is already reserved for the requested time period.',
        conflictingReservation: conflict
      });
    }
    // D. Dynamic price calculation
    const {
      hours,
      totalAmount,
      discountApplied
    }
 = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerHour: space.pricePerHour
    });
    const userId = req.user.id;
    // F. Create reservation
    const newReservation = await Reservation.create({
      userId,
      spaceId,
      startTime: start,
      endTime: end,
      totalAmount,
      note,
    });
    // Fetch and populate space info for response
    const populatedReservation = await Reservation.findById(newReservation._id)       .populate('userId', 'username role balance')       .populate('spaceId');
    return res.status(201).json({
      message: 'Reservation created successfully',
      discountApplied,
      hoursCalculated: hours,
      reservation: populatedReservation
    });
  }  catch (error) {
    console.error('Create reservation error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        message: 'Space not found'
      });
    }
    return res.status(500).json({
      message: 'Server error creating reservation'
    });
  }
};
module.exports = {
  getReservations,
  createReservation
};
