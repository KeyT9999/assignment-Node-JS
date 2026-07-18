const Booking = require('../models/bookingModel'), Schedule = require('../models/scheduleModel');
const scheduleFilter = (x) => ({
  theaterName: x.theaterName,
  movieName: x.movieName,
  showTime: new Date(x.showTime)
});
const validTickets = n => Number.isInteger(Number(n)) && Number(n)>0;
exports.list = async (_q, s) => {
  try {
    s.status(200).json(await Booking.find().sort({
      showTime: 1
    }))
  } catch (e) {
    s.status(500).json({
      message: e.message
    })
  }
};
exports.create = async (req, res) => {
  const {
    customerName,
    theaterName,
    movieName,
    showTime,
    numberOfTickets
  }
 = req.body;
  if (!customerName || !theaterName || !movieName || Number.isNaN(new Date(showTime).getTime()) || !validTickets(numberOfTickets))return res.status(400).json({
    message: 'Invalid booking data'
  });
  const qty = Number(numberOfTickets);
  try {
    const schedule = await Schedule.findOneAndUpdate({
      ...scheduleFilter(req.body),
      availableSeats: {
        $gte: qty
      }
    }, {
      $inc: {
        availableSeats: -qty
      }
    }, {
      new: true
    });
    if (!schedule)return res.status(409).json({
      message: 'Schedule not found or insufficient available seats'
    });
    try {
      const booking = await Booking.create({
        customerName,
        theaterName,
        movieName,
        showTime: new Date(showTime),
        numberOfTickets: qty,
        totalAmount: qty*schedule.ticketPrice
      });
      return res.status(201).json(booking)
    } catch (e) {
      await Schedule.findByIdAndUpdate(schedule._id, {
        $inc: {
          availableSeats: qty
        }
      });
      throw e
    }
  } catch (e) {
    res.status(500).json({
      message: e.message
    })
  }
};
exports.update = async (req, res) => {
  let reservedNew = null, restoredOld = false;
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking)return res.status(404).json({
      message: 'Booking not found'
    });
    const data = {
      customerName: req.body.customerName ?? booking.customerName,
      theaterName: req.body.theaterName ?? booking.theaterName,
      movieName: req.body.movieName ?? booking.movieName,
      showTime: req.body.showTime ?? booking.showTime,
      numberOfTickets: req.body.numberOfTickets ?? booking.numberOfTickets
    };
    if (!data.customerName || Number.isNaN(new Date(data.showTime).getTime()) || !validTickets(data.numberOfTickets))return res.status(400).json({
      message: 'Invalid booking data'
    });
    const oldSchedule = await Schedule.findOne(scheduleFilter(booking));
    const newSchedule = await Schedule.findOne(scheduleFilter(data));
    if (!oldSchedule || !newSchedule)return res.status(404).json({
      message: 'Schedule not found'
    });
    const qty = Number(data.numberOfTickets);
    if (String(oldSchedule._id) === String(newSchedule._id)) {
      const delta = qty-booking.numberOfTickets;
      if (delta>0) {
        reservedNew = await Schedule.findOneAndUpdate({
          _id: newSchedule._id,
          availableSeats: {
            $gte: delta
          }
        }, {
          $inc: {
            availableSeats: -delta
          }
        }, {
          new: true
        });
        if (!reservedNew)return res.status(409).json({
          message: 'Insufficient available seats'
        })
      } else if (delta<0) {
        await Schedule.findByIdAndUpdate(newSchedule._id, {
          $inc: {
            availableSeats: -delta
          }
        });
        restoredOld = true
      }
    } else {
      reservedNew = await Schedule.findOneAndUpdate({
        _id: newSchedule._id,
        availableSeats: {
          $gte: qty
        }
      }, {
        $inc: {
          availableSeats: -qty
        }
      }, {
        new: true
      });
      if (!reservedNew)return res.status(409).json({
        message: 'Insufficient available seats'
      });
      await Schedule.findByIdAndUpdate(oldSchedule._id, {
        $inc: {
          availableSeats: booking.numberOfTickets
        }
      });
      restoredOld = true
    }
    Object.assign(booking, data, {
      showTime: new Date(data.showTime),
      numberOfTickets: qty,
      totalAmount: qty*newSchedule.ticketPrice
    });
    return res.json(await booking.save())
  } catch (e) {
    res.status(500).json({
      message: e.message
    })
  }
};
exports.remove = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.bookingId);
    if (!booking)return res.status(404).json({
      message: 'Booking not found'
    });
    await Schedule.findOneAndUpdate(scheduleFilter(booking), {
      $inc: {
        availableSeats: booking.numberOfTickets
      }
    });
    res.json({
      message: 'Booking cancelled successfully'
    })
  } catch (e) {
    if (e.name === 'CastError')return res.status(404).json({
      message: 'Booking not found'
    });
    res.status(500).json({
      message: e.message
    })
  }
};
