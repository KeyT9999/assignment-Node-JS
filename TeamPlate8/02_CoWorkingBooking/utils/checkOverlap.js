/**
 * Overlap check utility to prevent double reservations.
 * Two intervals (S1, E1) and (S2, E2) overlap if:
 * S1 < E2 AND E1 > S2
 * 
 * @param {Object} params
 * @param {mongoose.Model} params.ReservationModel - The mongoose model for reservation/reservation
 * @param {String|mongoose.Types.ObjectId} params.spaceId - The ID of the space (space/station)
 * @param {Date|String} params.startTime - Requested start time (S1)
 * @param {Date|String} params.endTime - Requested end time (E1)
 * @returns {Promise<Object|null>} Returns the conflicting reservation if it exists, otherwise null
 */ const checkOverlap = async ({
  ReservationModel,
  spaceId,
  startTime,
  endTime
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const conflict = await ReservationModel.findOne({
    spaceId,
    startTime: {
      $lt: end
    },
    // S2 < E1 (existing start < requested end)
    endTime: {
      $gt: start
    }
    // E2 > S1 (existing end > requested start)
  });
  return conflict;
};
module.exports = checkOverlap;
