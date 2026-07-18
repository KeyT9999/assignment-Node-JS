const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const authConfig = require('../config/authConfig');

const fields = {
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: authConfig.allowedRoles,
    default: authConfig.defaultRole
  },
  isActive: {
    type: Boolean,
    default: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
};

if (authConfig.assignmentField) {
  fields[authConfig.assignmentField] = {
    type: mongoose.Schema.Types.ObjectId,
    ref: authConfig.assignmentRef,
    default: null
  };
}

const userSchema = new mongoose.Schema(fields, {
  versionKey: false
});

userSchema.pre('save', async function hashPassword(next) {
  try {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function safeJSON() {
  const value = this.toObject();
  delete value.password;
  return value;
};

module.exports = mongoose.model('User', userSchema);
