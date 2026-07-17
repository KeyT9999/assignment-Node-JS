// controllers/registrationController.js
const Registration = require('../models/registrationModel');
const Event = require('../models/eventModel');

exports.registerEvent = async (req, res) => {
  const { studentId, eventId } = req.body;
  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });

  const count = await Registration.countDocuments({ eventId });
  if (count >= event.capacity) {
    return res.status(400).json({ message: 'Event is full' });
  }

  const reg = await Registration.create({ studentId, eventId });
  res.status(201).json(reg);
};

exports.unregisterEvent = async (req, res) => {
  const reg = await Registration.findByIdAndDelete(req.params.registrationId);
  if (!reg) return res.status(404).json({ message: 'Registration not found' });
  res.json({ message: 'Unregistered successfully' });
};

exports.listRegistrations = async (req, res) => {
  const data = await Registration.find().populate('studentId eventId');
  if (data.length === 0) return res.json({ message: 'No registrations yet' });
  res.json(data);
};

exports.searchByDate = async (req, res) => {
  const { startDate, endDate } = req.query;
  if (new Date(startDate) > new Date(endDate))
    return res.status(400).json({ message: 'Start date must be before end date' });

  const data = await Registration.find({
    registrationDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    }
  }).populate('studentId eventId');
  res.json(data);
};
