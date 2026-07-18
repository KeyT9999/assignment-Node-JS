const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  transactionCode: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['restock', 'consume', 'transfer_out', 'transfer_in'],
    required: true
  },
  reagentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reagent',
    required: true
  },
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    required: true
  },
  destinationLaboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laboratory',
    default: null
  },
  batchNumber: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.0001
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0.01
  },
  totalValue: {
    type: Number
  },
  sampleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sample',
    default: null
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
  if (this.quantity && this.unitCost) {
    this.totalValue = this.quantity * this.unitCost;
  }
  
  if (this.transactionCode) return next();
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const yyyymmdd = `${year}${month}${day}`;
  
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  
  try {
    const count = await mongoose.model('ReagentTransaction').countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    const seq = String(count + 1).padStart(3, '0');
    this.transactionCode = `TXN-${yyyymmdd}-${seq}`;
  } catch (err) {
    const rand = String(Math.floor(Math.random() * 900) + 100);
    this.transactionCode = `TXN-${yyyymmdd}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('ReagentTransaction', schema);
