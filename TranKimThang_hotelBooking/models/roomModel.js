const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  roomType: { type: String, enum: ["standard", "deluxe", "suite"] },
  capacity: { type: Number },
  status: { type: String, enum: ["available", "maintenance"] },
  pricePerNight: { type: Number },
  amenities: { type: [String] },
});

module.exports = mongoose.model('Room', schema);
