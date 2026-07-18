const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  eventId: {
    type: String,
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
});
schema.index({
  studentId: 1,
  eventId: 1
}, {
  unique: true
});
module.exports = mongoose.model('Registration', schema);
