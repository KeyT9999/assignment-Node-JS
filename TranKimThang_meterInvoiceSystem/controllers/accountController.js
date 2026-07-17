const mongoose = require('mongoose');
const Account = require('../models/customerAccountModel');
const Meter = require('../models/meterModel');
const Tariff = require('../models/tariffPlanModel');
exports.tariff = async (req, res) => {
  if (await Tariff.exists({
    tariffCode: req.body.tariffCode
  }))return res.status(409).json({
    message: 'Duplicate tariff'
  });
  const t = req.body.tiers || [];
  for (let i = 0; i<t.length; i++)if (t[i].minKwh<0 || t[i].maxKwh <= t[i].minKwh || (i && t[i].minKwh !== t[i-1].maxKwh))return res.status(400).json({
    message: 'Tiers must be continuous and non-overlapping'
  });
  res.status(201).json(await Tariff.create(req.body));
};
exports.customer = async (req, res) => {
  const s = await mongoose.startSession();
  try {
    let a;
    await s.withTransaction(async () => {
      if (await Account.exists({
        accountCode: req.body.accountCode
      }) || await Meter.exists({
        meterCode: req.body.meterCode
      }))throw Object.assign(new Error('Duplicate code'), {
        status: 409
      });
      [a] = await Account.create([{
        ...req.body.account
      }], {
        session: s
      });
      await Meter.create([{
        ...req.body.meter,
        accountId: a._id,
        serviceZone: a.serviceZone
      }], {
        session: s
      });
    });
    res.status(201).json(a);
  } catch (e) {
    res.status(e.status || 400).json({
      message: e.message
    });
  } finally {
    await s.endSession();
  }
};
exports.list = async (req, res) => {
  const q = {
  };
  if (req.query.zone)q.serviceZone = req.query.zone;
  if (req.query.status)q.status = req.query.status;
  if (req.query.hasDebt === 'true')q.outstandingBalance = {
    $gt: 0
  };
  res.json(await Account.find(q));
};
