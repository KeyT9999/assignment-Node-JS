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
    enum: ['warehouse_manager',
    'stock_keeper',
    'auditor'],
    default: 'stock_keeper'
  },
  assignedWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
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
  if (!this.isModified('password'))return next();
  this.password = await bcrypt.hash(this.password, 10);
  next()
});
schema.methods.comparePassword = function(value) {
  return bcrypt.compare(value, this.password)
};
module.exports = mongoose.model('User', schema);
