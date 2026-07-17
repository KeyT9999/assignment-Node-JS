const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

// @desc    Student Event Registration
// @route   POST /registrations
// @access  Private (Student only)
const registerEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' });
    }

    // 1. Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Check if the student has already registered for this event
    const studentId = req.user.id;
    const existingRegistration = await Registration.findOne({ studentId, eventId });
    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    // 3. Check event capacity
    const currentRegistrationsCount = await Registration.countDocuments({ eventId });
    if (currentRegistrationsCount >= event.capacity) {
      return res.status(400).json({ message: 'Registration is only allowed if the event has not reached the maximum capacity' });
    }

    // 4. Create registration
    const registration = await Registration.create({
      studentId,
      eventId,
      registrationDate: new Date()
    });

    // 5. Populate registration info for response
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('studentId', 'username role')
      .populate('eventId', 'name capacity date');

    // 6. Simulate real-time notification (Console log + Notification message in response)
    console.log(`[REAL-TIME NOTIFICATION]: Student ${req.user.username} has registered for event "${event.name}"!`);

    return res.status(201).json({
      message: 'Event registered successfully',
      notification: `Real-time: New registration for "${event.name}" by ${req.user.username}`,
      registration: populatedRegistration
    });

  } catch (error) {
    console.error('Event registration error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.status(500).json({ message: 'Server error during event registration' });
  }
};

// @desc    Student Event Unregistration
// @route   DELETE /registrations/:registrationId
// @access  Private (Student only)
const unregisterEvent = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // 1. Find registration
    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // 2. Authorization check (only the student who registered can unregister)
    if (registration.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only unregister your own events' });
    }

    // 3. Delete registration
    await Registration.findByIdAndDelete(registrationId);

    return res.status(200).json({
      message: 'Unregistration successful',
      registrationId
    });

  } catch (error) {
    console.error('Event unregistration error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Registration not found' });
    }
    return res.status(500).json({ message: 'Server error during unregistration' });
  }
};

// @desc    Admin View Registered Event List (Paginated)
// @route   GET /listRegistrations
// @access  Private (Admin only)
const listRegistrations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalRegistrations = await Registration.countDocuments();

    // Constraint: If no student has registered, return an appropriate message
    if (totalRegistrations === 0) {
      return res.status(200).json({
        message: 'No student has registered for any events yet.',
        registrations: [],
        totalPages: 0,
        currentPage: page,
        total: 0
      });
    }

    const registrations = await Registration.find()
      .populate('studentId', 'username role')
      .populate('eventId', 'name capacity date')
      .skip(skip)
      .limit(limit)
      .sort({ registrationDate: -1 });

    return res.status(200).json({
      message: 'Registrations retrieved successfully',
      registrations,
      totalPages: Math.ceil(totalRegistrations / limit),
      currentPage: page,
      total: totalRegistrations
    });

  } catch (error) {
    console.error('List registrations error:', error.message);
    return res.status(500).json({ message: 'Server error retrieving registration list' });
  }
};

// @desc    Admin Search Registrations by Date
// @route   GET /getRegistrationsByDate
// @access  Private (Admin only)
const getRegistrationsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate query parameters are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate date format
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Constraint: registrationDate start must be earlier than registrationDate end
    if (start >= end) {
      return res.status(400).json({ message: 'registrationDate start must be earlier than registrationDate end' });
    }

    const registrations = await Registration.find({
      registrationDate: { $gte: start, $lte: end }
    })
      .populate('studentId', 'username role')
      .populate('eventId', 'name capacity date')
      .sort({ registrationDate: 1 });

    if (registrations.length === 0) {
      return res.status(200).json({
        message: 'No registrations found within the specified date range.',
        registrations: []
      });
    }

    return res.status(200).json({
      message: 'Registrations found successfully',
      count: registrations.length,
      registrations
    });

  } catch (error) {
    console.error('Search registrations by date error:', error.message);
    return res.status(500).json({ message: 'Server error searching registrations' });
  }
};

module.exports = {
  registerEvent,
  unregisterEvent,
  listRegistrations,
  getRegistrationsByDate
};
