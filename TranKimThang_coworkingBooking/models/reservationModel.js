const mongoose = require('mongoose');



const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Space',
    required: [true, 'Space ID is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
 
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required']
  },
  note: {
    type: String,
    trim: true
  }
});

module.exports = mongoose.model('Reservation', bookingSchema);
