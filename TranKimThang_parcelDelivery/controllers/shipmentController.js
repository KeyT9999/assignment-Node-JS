const Shipment = require('../models/shipmentModel');
const DeliveryZone = require('../models/deliveryZoneModel');
exports.list = async (req, res) => {
  const q = req.user.role === 'admin'? {
  }
  : {
    userId: req.user.userId
  };
  res.json(await Shipment.find(q).populate('zoneId'));
};
exports.create = async (req, res) => {
  const {
    zoneId,
    receiverName,
    receiverAddress,
    distanceKm,
    weightKg,
    deliveryType,
    declaredValue
  }
 = req.body;
  if (!receiverName || !receiverAddress || distanceKm <= 0 || weightKg <= 0 || declaredValue<0)return res.status(400).json({
    message: 'Invalid shipment input'
  });
  const zone = await DeliveryZone.findById(zoneId);
  if (!zone)return res.status(404).json({
    message: 'Delivery zone not found'
  });
  if (zone.status === 'suspended' || weightKg>zone.maxWeightKg)return res.status(400).json({
    message: 'Zone suspended or parcel overweight'
  });
  let totalFee = zone.baseFee+distanceKm*zone.feePerKm+weightKg*zone.feePerKg;
  if (deliveryType === 'express')totalFee *= 1.4;
  if (declaredValue>2000000)totalFee += declaredValue*.01;
  res.status(201).json(await Shipment.create({
    userId: req.user.userId,
    zoneId,
    receiverName,
    receiverAddress,
    distanceKm,
    weightKg,
    deliveryType,
    declaredValue,
    totalFee,
    status: 'pending'
  }));
};
exports.updateStatus = async (req, res) => {
  if (req.user.role !== 'admin')return res.status(403).json({
    message: 'Admin only'
  });
  const s = await Shipment.findById(req.params.id);
  if (!s)return res.status(404).json({
    message: 'Shipment not found'
  });
  const next = req.body.status, flow = {
    pending: 'accepted',
    accepted: 'in_transit',
    in_transit: 'delivered'
  };
  if (!((s.status === 'pending' && next === 'cancelled') || flow[s.status] === next))return res.status(400).json({
    message: 'Invalid status transition'
  });
  s.status = next;
  await s.save();
  res.json(s);
};
