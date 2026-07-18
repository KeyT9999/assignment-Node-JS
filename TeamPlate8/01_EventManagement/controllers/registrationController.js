const Registration = require('../models/registrationModel'), Event = require('../models/eventModel');
exports.register = async (req, res) => {
  try {
    const {
      eventId
    }
 = req.body;
    if (!eventId)return res.status(400).json({
      message: 'eventId is required'
    });
    const event = await Event.findById(eventId);
    if (!event)return res.status(404).json({
      message: 'Event not found'
    });
    const studentId = String(req.user.id);
    if (await Registration.exists({
      studentId,
      eventId: String(eventId)
    }))return res.status(409).json({
      message: 'Student has already registered for this event'
    });
    const count = await Registration.countDocuments({
      eventId: String(eventId)
    });
    if (count >= event.capacity)return res.status(409).json({
      message: 'Event has reached the maximum capacity'
    });
    const registration = await Registration.create({
      studentId,
      eventId: String(eventId),
      registrationDate: new Date()
    });
    console.log(`[REAL-TIME NOTIFICATION] New registration for ${event.name} by ${req.user.username}`);
    res.status(201).json({
      message: 'Event registered successfully',
      notification: `New registration for ${event.name}`,
      registration
    })
  } catch (e) {
    if (e.code === 11000)return res.status(409).json({
      message: 'Student has already registered for this event'
    });
    res.status(500).json({
      message: e.message
    })
  }
};
exports.unregister = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId);
    if (!registration)return res.status(404).json({
      message: 'Registration not found'
    });
    if (registration.studentId !== String(req.user.id))return res.status(403).json({
      message: 'You can only unregister your own events'
    });
    await registration.deleteOne();
    res.json({
      message: 'Unregistration successful'
    })
  } catch (e) {
    if (e.name === 'CastError')return res.status(404).json({
      message: 'Registration not found'
    });
    res.status(500).json({
      message: e.message
    })
  }
};
exports.list = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1), limit = Math.max(1, parseInt(req.query.limit) || 5), total = await Registration.countDocuments();
  if (!total)return res.status(200).json({
    message: 'No student has registered for any events yet.',
    registrations: [],
    totalPages: 0,
    currentPage: page,
    total: 0
  });
  const registrations = await Registration.find().sort({
    registrationDate: -1
  }).skip((page-1)*limit).limit(limit);
  res.json({
    registrations,
    totalPages: Math.ceil(total/limit),
    currentPage: page,
    total
  })
};
exports.byDate = async (req, res) => {
  const startValue = req.query.startDate || req.query.start, endValue = req.query.endDate || req.query.end;
  if (!startValue || !endValue)return res.status(400).json({
    message: 'Both startDate and endDate are required'
  });
  const start = new Date(startValue), end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end)return res.status(400).json({
    message: 'registrationDate start must be earlier than registrationDate end'
  });
  const registrations = await Registration.find({
    registrationDate: {
      $gte: start,
      $lte: end
    }
  }).sort({
    registrationDate: 1
  });
  res.json({
    count: registrations.length,
    registrations
  })
};
