// controllers/eventController.js
const Event = require('../models/eventModel');

exports.getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};