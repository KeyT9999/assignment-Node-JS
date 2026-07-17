// models/eventModel.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: String,
  description: String,
  location: String,
  date: Date,
  capacity: Number,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Event', eventSchema);