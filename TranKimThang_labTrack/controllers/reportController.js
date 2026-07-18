const Sample = require('../models/sampleModel');
const ReagentTransaction = require('../models/reagentTransactionModel');
const mongoose = require('mongoose');

exports.sampleTurnaround = async (req, res) => {
  try {
    if (!req.user || !['laboratory_manager', 'quality_auditor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Manager or Auditor access required' });
    }

    const { laboratoryId, testId, from, to } = req.query;
    const matchQuery = { status: 'completed' };

    if (laboratoryId) {
      matchQuery.laboratoryId = new mongoose.Types.ObjectId(laboratoryId);
    }
    if (testId) {
      matchQuery.testId = new mongoose.Types.ObjectId(testId);
    }
    if (from || to) {
      matchQuery.completedAt = {};
      if (from) matchQuery.completedAt.$gte = new Date(from);
      if (to) matchQuery.completedAt.$lte = new Date(to);
    }

    const report = await Sample.aggregate([
      { $match: matchQuery },
      {
        $project: {
          laboratoryId: 1,
          testId: 1,
          turnaround: {
            $divide: [
              { $subtract: ['$completedAt', '$receivedAt'] },
              1000 * 60 // convert to minutes
            ]
          },
          isUrgent: {
            $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0]
          }
        }
      },
      {
        $group: {
          _id: { laboratoryId: '$laboratoryId', testId: '$testId' },
          completedSampleCount: { $sum: 1 },
          totalTurnaround: { $sum: '$turnaround' },
          urgentSampleCount: { $sum: '$isUrgent' }
        }
      },
      {
        $lookup: {
          from: 'laboratories',
          localField: '_id.laboratoryId',
          foreignField: '_id',
          as: 'laboratory'
        }
      },
      {
        $lookup: {
          from: 'testcatalogues',
          localField: '_id.testId',
          foreignField: '_id',
          as: 'test'
        }
      },
      {
        $unwind: '$laboratory'
      },
      {
        $unwind: '$test'
      },
      {
        $project: {
          _id: 0,
          laboratoryCode: '$laboratory.laboratoryCode',
          laboratoryName: '$laboratory.name',
          testCode: '$test.testCode',
          testName: '$test.name',
          completedSampleCount: 1,
          averageTurnaroundMinutes: {
            $round: [
              {
                $cond: [
                  { $gt: ['$completedSampleCount', 0] },
                  { $divide: ['$totalTurnaround', '$completedSampleCount'] },
                  0
                ]
              },
              1
            ]
          },
          urgentSampleCount: 1
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reagentUsage = async (req, res) => {
  try {
    if (!req.user || !['laboratory_manager', 'quality_auditor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Manager or Auditor access required' });
    }

    const { reagentId, laboratoryId, from, to } = req.query;
    const matchQuery = { type: 'consume' };

    if (reagentId) {
      matchQuery.reagentId = new mongoose.Types.ObjectId(reagentId);
    }
    if (laboratoryId) {
      matchQuery.laboratoryId = new mongoose.Types.ObjectId(laboratoryId);
    }
    if (from || to) {
      matchQuery.createdAt = {};
      if (from) matchQuery.createdAt.$gte = new Date(from);
      if (to) matchQuery.createdAt.$lte = new Date(to);
    }

    const now = new Date();

    const report = await ReagentTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { reagentId: '$reagentId', laboratoryId: '$laboratoryId' },
          totalQuantityConsumed: { $sum: '$quantity' },
          totalValueConsumed: { $sum: '$totalValue' }
        }
      },
      {
        $lookup: {
          from: 'reagents',
          localField: '_id.reagentId',
          foreignField: '_id',
          as: 'reagent'
        }
      },
      {
        $lookup: {
          from: 'laboratories',
          localField: '_id.laboratoryId',
          foreignField: '_id',
          as: 'laboratory'
        }
      },
      {
        $unwind: '$reagent'
      },
      {
        $unwind: '$laboratory'
      },
      {
        $lookup: {
          from: 'reagentledgers',
          let: { rId: '$_id.reagentId', lId: '$_id.laboratoryId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                     { $eq: ['$reagentId', '$$rId'] },
                     { $eq: ['$laboratoryId', '$$lId'] },
                     { $gt: ['$expiryDate', now] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$quantity' }
              }
            }
          ],
          as: 'ledgerStock'
        }
      },
      {
        $project: {
          _id: 0,
          reagentCode: '$reagent.reagentCode',
          reagentName: '$reagent.name',
          laboratoryCode: '$laboratory.laboratoryCode',
          laboratoryName: '$laboratory.name',
          totalQuantityConsumed: 1,
          totalValueConsumed: 1,
          currentNonExpiredStock: {
            $ifNull: [ { $arrayElemAt: ['$ledgerStock.total', 0] }, 0 ]
          }
        }
      }
    ]);

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
