const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryZone',
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverAddress: {
    type: String,
    required: true
  },
  distanceKm: {
    type: Number,
    required: true
  },
  weightKg: {
    type: Number,
    required: true
  },
  deliveryType: {
    type: String,
    enum: ['standard',
    'express'],
    required: true
  },
  declaredValue: {
    type: Number,
    required: true,
    min: 0
  },
  totalFee: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending',
    'accepted',
    'in_transit',
    'delivered',
    'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
module.exports = mongoose.model('Shipment', schema);
