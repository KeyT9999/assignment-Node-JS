const Reading = require('../models/meterReadingModel');
const Invoice = require('../models/invoiceModel');
exports.consumption = async (req, res) => res.json(await Reading.aggregate([{
  $match: req.query.month? {
    billingMonth: req.query.month
  }
  : {
  }
}, {
  $group: {
    _id: '$billingMonth',
    accountCount: {
      $sum: 1
    },
    totalConsumptionKwh: {
      $sum: '$consumptionKwh'
    },
    averageConsumptionKwh: {
      $avg: '$consumptionKwh'
    }
  }
}]));
exports.collection = async (req, res) => res.json(await Invoice.aggregate([{
  $match: req.query.status? {
    status: req.query.status
  }
  : {
  }
}, {
  $group: {
    _id: null,
    billedAmount: {
      $sum: '$totalAmount'
    },
    collectedAmount: {
      $sum: '$paidAmount'
    },
    outstandingAmount: {
      $sum: {
        $subtract: ['$totalAmount',
        '$paidAmount']
      }
    }
  }
}]));
