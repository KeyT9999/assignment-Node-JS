const Reservation = require('../models/reservationModel');
const Space = require('../models/spaceModel');
const User = require('../models/userModel');
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');

const getReservations = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }

    const bookings = await Reservation.find(query)
      .populate('userId', 'username role')
      .populate('spaceId');

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

const createReservation = async (req, res) => {
  try {
    const { spaceId, startTime, endTime, note } = req.body;

    if (!spaceId || !startTime || !endTime) {
      return res.status(400).json({ message: 'spaceId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be strictly before end time' });
    }

    const resource = await Space.findById(spaceId);
    if (!resource) {
      return res.status(404).json({ message: 'Space not found' });
    }

    if (resource.status === 'maintenance' || resource.status === 'offline') {
      return res.status(403).json({
        message: `This resource is currently unavailable due to status: ${resource.status}`
      });
    }

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

    const { hours, totalAmount, discountApplied } = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerUnit: resource.pricePerHour
    });

    const userId = req.user.id;
    let user = null;

    if (process.env.ENABLE_WALLET === 'true') {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Authenticated user not found in database' });
      }

      if (user.balance < totalAmount) {
        return res.status(402).json({
          message: `Payment Required: Insufficient wallet balance. Total amount: ${totalAmount}, Current balance: ${user.balance}`
        });
      }

      user.balance -= totalAmount;
      await user.save();
    }

    const newReservation = await Reservation.create({
      userId,
      spaceId,
      startTime: start,
      endTime: end,

      totalAmount,
      note,
      status: 'pending'
    });

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
