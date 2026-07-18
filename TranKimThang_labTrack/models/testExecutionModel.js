const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  executionCode: {
    type: String,
    unique: true
  },
  sampleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sample',
    required: true,
    unique: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCatalogue',
    required: true
  },
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true
  },
  reagentCost: {
    type: Number,
    default: 0
  },
  testFee: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  resultSummary: {
    type: String,
    default: null
  },
  resultStatus: {
    type: String,
    enum: ['pending', 'normal', 'abnormal', 'inconclusive'],
    default: 'pending'
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

schema.pre('save', async function(next) {
  if (this.executionCode) return next();
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const yyyymmdd = `${year}${month}${day}`;
  
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  try {
    const count = await mongoose.model('TestExecution').countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const seq = String(count + 1).padStart(3, '0');
    this.executionCode = `TEST-${yyyymmdd}-${seq}`;
  } catch (err) {
    const rand = String(Math.floor(Math.random() * 900) + 100);
    this.executionCode = `TEST-${yyyymmdd}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('TestExecution', schema);
