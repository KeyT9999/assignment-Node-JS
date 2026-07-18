/**
 * Overlap check utility to prevent double sessions.
 * Two intervals (S1, E1) and (S2, E2) overlap if:
 * S1 < E2 AND E1 > S2
 * 
 * @param {Object} params
 * @param {mongoose.Model} params.SessionModel - The mongoose model for session/reservation
 * @param {String|mongoose.Types.ObjectId} params.stationId - The ID of the station (space/station)
 * @param {Date|String} params.startTime - Requested start time (S1)
 * @param {Date|String} params.endTime - Requested end time (E1)
 * @returns {Promise<Object|null>} Returns the conflicting session if it exists, otherwise null
 */ 
const checkOverlap = async ({
  SessionModel,
  stationId,
  startTime,
  endTime
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Truy vấn cơ sở dữ liệu để tìm phiên sạc đã tồn tại bị trùng lặp thời gian.
  // Điều kiện trùng lặp: S2 < E1 (startTime của bản ghi trong DB < endTime của yêu cầu mới)
  // và E2 > S1 (endTime của bản ghi trong DB > startTime của yêu cầu mới)
  const conflict = await SessionModel.findOne({
    stationId,
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

