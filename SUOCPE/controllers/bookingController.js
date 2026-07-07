const Booking = require('../models/bookingModel');
const Resource = require('../models/resourceModel');
const User = require('../models/userModel');
const calculatePrice = require('../utils/calculatePrice');
const checkOverlap = require('../utils/checkOverlap');

// @desc    Get bookings
// @route   GET /bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    let query = {};

    // RBAC: Customers can only see their own bookings, Admins see all
    if (req.user.role === 'customer') {
      query.userId = req.user.id;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'username role')
      .populate('resourceId');

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

// @desc    Create a booking
// @route   POST /bookings (also aliased as POST /bookings/book)
// @access  Private (Admin or Customer)
const createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, quantityEstimate, note } = req.body;

    // Validate request body
    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({ message: 'resourceId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    // A. Time validation
    // 1. Check if startTime is after or equal to current time
    if (start < now) {
      return res.status(400).json({ message: 'Start time cannot be in the past' });
    }

    // 2. Check if startTime is before endTime
    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be strictly before end time' });
    }

    // B. Resource availability check
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Reject if resource status is maintenance or offline
    if (resource.status === 'maintenance' || resource.status === 'offline') {
      return res.status(403).json({
        message: `This resource is currently unavailable due to status: ${resource.status}`
      });
    }

    // C. Overlap conflict check
    const conflict = await checkOverlap({
      BookingModel: Booking,
      resourceId,
      startTime: start,
      endTime: end
    });

    if (conflict) {
      return res.status(409).json({
        message: 'The selected resource is already reserved for the requested time period.',
        conflictingBooking: conflict
      });
    }

    // D. Dynamic price calculation
    const { hours, totalAmount, discountApplied } = calculatePrice({
      startTime: start,
      endTime: end,
      pricePerUnit: resource.pricePerUnit
    });

    // E. Wallet payment mode validation & processing
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

      // Deduct balance and save user
      user.balance -= totalAmount;
      await user.save();
    }

    // F. Create booking
    const newBooking = await Booking.create({
      userId,
      resourceId,
      startTime: start,
      endTime: end,
      quantityEstimate: quantityEstimate || 1,
      totalAmount,
      note,
      status: 'pending' // default status
    });

    // Fetch and populate resource info for response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('userId', 'username role balance')
      .populate('resourceId');

    return res.status(201).json({
      message: 'Booking created successfully',
      discountApplied,
      hoursCalculated: hours,
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Create booking error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Resource not found' });
    }
    return res.status(500).json({ message: 'Server error creating booking' });
  }
};

module.exports = {
  getBookings,
  createBooking
};
