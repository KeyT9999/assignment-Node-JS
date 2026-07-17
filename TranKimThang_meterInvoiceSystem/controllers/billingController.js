const mongoose = require('mongoose');
const Meter = require('../models/meterModel');
const Reading = require('../models/meterReadingModel');
const Invoice = require('../models/invoiceModel');
const Tariff = require('../models/tariffPlanModel');
const Account = require('../models/customerAccountModel');
const Payment = require('../models/paymentTransactionModel');
exports.reading = async (req, res) => {
  const m = await Meter.findById(req.body.meterId);
  if (!m || m.status !== 'active' || req.body.currentReading<m.currentReading || !/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(req.body.billingMonth))return res.status(400).json({
    message: 'Invalid reading'
  });
  if (req.user.role === 'meter_reader' && m.serviceZone !== req.user.assignedZone)return res.status(403).json({
    message: 'Wrong zone'
  });
  if (await Reading.exists({
    meterId: m._id,
    billingMonth: req.body.billingMonth
  }))return res.status(409).json({
    message: 'Duplicate meter month'
  });
  const s = await mongoose.startSession();
  let r;
  await s.withTransaction(async () => {
    [r] = await Reading.create([{
      meterId: m._id,
      previousReading: m.currentReading,
      currentReading: req.body.currentReading,
      consumptionKwh: req.body.currentReading-m.currentReading,
      billingMonth: req.body.billingMonth,
      recordedBy: req.user.userId
    }], {
      session: s
    });
    m.currentReading = req.body.currentReading;
    m.lastReadingAt = new Date();
    await m.save({
      session: s
    });
  });
  await s.endSession();
  res.status(201).json(r);
};
exports.invoice = async (req, res) => {
  const r = await Reading.findById(req.body.meterReadingId), tariff = await Tariff.findById(req.body.tariffId);
  if (!r || await Invoice.exists({
    meterReadingId: r?._id
  }))return res.status(409).json({
    message: 'Reading missing or already invoiced'
  });
  const meter = await Meter.findById(r.meterId), account = await Account.findById(meter.accountId);
  if (!tariff || !tariff.isActive || meter.status !== 'active' || account.status !== 'active')return res.status(400).json({
    message: 'Tariff/account inactive'
  });
  let subtotal = 0;
  for (const t of tariff.tiers) {
    const units = Math.max(0, Math.min(r.consumptionKwh, t.maxKwh ?? Infinity)-t.minKwh);
    subtotal += units*t.pricePerKwh;
  }
  const taxAmount = subtotal*tariff.taxRate, totalAmount = subtotal+taxAmount, dueDate = new Date(Date.now()+15*86400000), s = await mongoose.startSession();
  let inv;
  await s.withTransaction(async () => {
    [inv] = await Invoice.create([{
      accountId: account._id,
      meterReadingId: r._id,
      tariffId: tariff._id,
      subtotal,
      taxAmount,
      totalAmount,
      dueDate,
      status: 'unpaid'
    }], {
      session: s
    });
    account.outstandingBalance += totalAmount;
    await account.save({
      session: s
    });
  });
  await s.endSession();
  res.status(201).json(inv);
};
exports.payment = async (req, res) => {
  const inv = await Invoice.findById(req.params.id), amount = Number(req.body.amount);
  if (!inv || !['unpaid', 'partially_paid', 'overdue'].includes(inv.status) || amount <= 0)return res.status(400).json({
    message: 'Invalid payment'
  });
  if (inv.paidAmount+amount>inv.totalAmount)return res.status(409).json({
    message: 'Overpayment'
  });
  const a = await Account.findById(inv.accountId), s = await mongoose.startSession();
  await s.withTransaction(async () => {
    await Payment.create([{
      invoiceId: inv._id,
      amount,
      method: req.body.method,
      receivedBy: req.user.userId
    }], {
      session: s
    });
    inv.paidAmount += amount;
    inv.status = inv.paidAmount === inv.totalAmount?'paid':'partially_paid';
    a.outstandingBalance = Math.max(0, a.outstandingBalance-amount);
    await inv.save({
      session: s
    });
    await a.save({
      session: s
    });
  });
  await s.endSession();
  res.json(inv);
};
