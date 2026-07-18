const mongoose = require('mongoose');
const Rental = require('../models/rentalModel');
const Equipment = require('../models/equipmentModel');
exports.createRental = async (req, res) => {
  const {
    equipmentId,
    startDate,
    endDate,
    quantity
  }
 = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const qty = Number(quantity);
  if (!mongoose.isValidObjectId(equipmentId) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end || !Number.isInteger(qty) || qty < 1) return res.status(400).json({
    message: 'Invalid rental data'
  });
  try {
    const equipment = await Equipment.findOneAndUpdate({
      _id: equipmentId,
      stockQuantity: {
        $gte: qty
      }
    }, {
      $inc: {
        stockQuantity: -qty
      }
    }, {
      new: true
    });
    if (!equipment) return res.status(400).json({
      message: 'Not enough stock available.'
    });
    try {
      const rental = await Rental.create({
        userId: req.user.id,
        equipmentId,
        startDate: start,
        endDate: end,
        quantity: qty,
        depositAmount: equipment.depositFee * qty,
        status: 'active',
        rentalDate: new Date()
      });
      return res.status(201).json(rental);
    }     catch (error) {
      await Equipment.findByIdAndUpdate(equipmentId, {
        $inc: {
          stockQuantity: qty
        }
      });
      throw error;
    }
  }  catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
exports.returnRental = async (req, res) => {
  try {
    const rental = await Rental.findOne({
      _id: req.params.id,
      status: 'active'
    }).populate('equipmentId');
    if (!rental) return res.status(404).json({
      message: 'Active rental not found'
    });
    const returnedAt = new Date();
    const lateMs = Math.max(0, returnedAt - rental.endDate);
    const lateDays = Math.ceil(lateMs / 86400000);
    rental.status = 'returned';
    rental.returnDate = returnedAt;
    rental.fineAmount = 0.1 * rental.equipmentId.pricePerDay * lateDays * rental.quantity;
    await Equipment.findByIdAndUpdate(rental.equipmentId._id, {
      $inc: {
        stockQuantity: rental.quantity
      }
    });
    await rental.save();
    return res.json(rental);
  }  catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};
exports.getRentals = async (req, res) => {
  const filter = req.user.role === 'admin' ? {
  }
  : {
    userId: req.user.id
  };
  return res.json(await Rental.find(filter).populate('userId', 'username role').populate('equipmentId'));
};
exports.getRentalsByDate = async (req, res) => {
  const start = new Date(req.query.start);
  const end = new Date(req.query.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) return res.status(400).json({
    message: 'Invalid date range.'
  });
  const filter = {
    rentalDate: {
      $gte: start,
      $lte: end
    }
  };
  if (req.user.role !== 'admin') filter.userId = req.user.id;
  return res.json(await Rental.find(filter).populate('equipmentId'));
};
