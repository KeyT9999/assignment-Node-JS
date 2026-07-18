// Nhập model Reservation để truy vấn các đơn đặt chỗ hiện có
const Reservation = require('../models/reservationModel');

/**
 * Hàm bất đồng bộ kiểm tra xem một không gian làm việc (space) đã được đặt trùng lịch trong
 * khoảng thời gian yêu cầu hay chưa.
 * 
 * @param {Object} params
 * @param {string} params.spaceId - ID của không gian cần kiểm tra
 * @param {Date|string} params.startTime - Thời gian bắt đầu mong muốn
 * @param {Date|string} params.endTime - Thời gian kết thúc mong muốn
 * @returns {Promise<Object|null>} Trả về bản ghi đơn đặt chỗ bị trùng lặp đầu tiên tìm thấy, hoặc null nếu không trùng
 */
const checkOverlap = async ({ spaceId, startTime, endTime }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  /**
   * Truy vấn tìm các đơn đặt chỗ có cùng spaceId mà khoảng thời gian giao nhau:
   * - Có thời gian bắt đầu (startTime trong DB) nhỏ hơn thời gian kết thúc của lượt đặt chỗ mới (end)
   *   VÀ
   * - Có thời gian kết thúc (endTime trong DB) lớn hơn thời gian bắt đầu của lượt đặt chỗ mới (start)
   */
  const conflict = await Reservation.findOne({
    spaceId,
    startTime: { $lt: end },
    endTime: { $gt: start }
  });

  return conflict;
};

module.exports = checkOverlap;
