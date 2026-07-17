const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const schema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['billing_manager',
    'meter_reader',
    'auditor'],
    default: 'meter_reader'
  },
  assignedZone: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
schema.pre('save', async function(next) {
  if (this.isModified('password'))this.password = await bcrypt.hash(this.password, 10);
  next();
});
module.exports = mongoose.model('User', schema);
