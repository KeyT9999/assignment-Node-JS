const Reservation = require('../models/reservationModel');

const checkOverlap = async ({ spaceId, startTime, endTime }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const conflict = await Reservation.findOne({
    spaceId,
    startTime: { $lt: end },
    endTime: { $gt: start }
  });

  return conflict;
};

module.exports = checkOverlap;
