const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  checkInDate: { type: Date },
  checkOutDate: { type: Date },
  numberOfGuests: { type: Number },
  totalAmount: { type: Number },
  status: { type: String, enum: ["confirmed", "cancelled", "completed"] },
  note: { type: String },
});

module.exports = mongoose.model('Reservation', schema);
