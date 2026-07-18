const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  sampleCode: {
    type: String,
    unique: true
  },
  patientCode: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCatalogue',
    required: true
  },
  sampleType: {
    type: String,
    required: true
  },
  collectedAt: {
    type: Date,
    required: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['received', 'in_progress', 'completed', 'rejected', 'cancelled'],
    default: 'received'
  },
  priority: {
    type: String,
    enum: ['routine', 'urgent'],
    default: 'routine'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

schema.pre('save', async function(next) {
  if (this.sampleCode) return next();
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const yyyymmdd = `${year}${month}${day}`;
  
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  try {
    const count = await mongoose.model('Sample').countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const seq = String(count + 1).padStart(3, '0');
    this.sampleCode = `SMP-${yyyymmdd}-${seq}`;
  } catch (err) {
    const rand = String(Math.floor(Math.random() * 900) + 100);
    this.sampleCode = `SMP-${yyyymmdd}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Sample', schema);
