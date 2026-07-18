const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin',
    'customer'],
    default: 'customer'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('User', schema);
