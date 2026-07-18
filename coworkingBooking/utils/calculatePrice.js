/**
 * Hàm tính toán chi phí đặt chỗ dựa trên thời gian và các cấu hình hệ thống.
 * 
 * @param {Object} params
 * @param {Date|string} params.startTime - Thời gian bắt đầu đặt chỗ
 * @param {Date|string} params.endTime - Thời gian kết thúc đặt chỗ
 * @param {number} params.pricePerUnit - Giá thuê mỗi giờ của không gian
 * @returns {Object} Kết quả gồm số giờ đã tính, tổng tiền và trạng thái có áp dụng giảm giá hay không
 */
const calculatePrice = ({ startTime, endTime, pricePerUnit }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Tính khoảng thời gian chênh lệch (mili-giây)
  const durationMs = end - start;
  // Quy đổi từ mili-giây sang giờ (1 giờ = 1000ms * 60 giây * 60 phút)
  const hours = durationMs / (1000 * 60 * 60);

  // Kiểm tra tính hợp lệ của thời gian
  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }

  let totalAmount = 0;

  // Nếu hệ thống đang cấu hình chế độ định giá xe điện 'EV'
  if (process.env.PRICING_MODE === 'EV') {
    // Chi phí = Số giờ * hệ số nhân 15 * đơn giá
    totalAmount = hours * 15 * pricePerUnit;
  } else {
    // Chế độ tính giá bình thường: Chi phí = Số giờ * đơn giá
    totalAmount = hours * pricePerUnit;
  }

  let discountApplied = false;
  // Kiểm tra nếu tính năng Giờ Vàng (Happy Hour) được kích hoạt
  if (process.env.ENABLE_HAPPY_HOUR === 'true') {
    // Lấy giờ của thời điểm bắt đầu đặt chỗ (theo múi giờ local của server)
    const startHour = start.getHours();

    // Giờ vàng áp dụng từ 22h đêm (10 PM) đến trước 4h sáng hôm sau
    if (startHour >= 22 || startHour < 4) {
      // Giảm giá 30% (tính 70% tổng tiền ban đầu)
      totalAmount = totalAmount * 0.7;
      discountApplied = true;
    }
  }

  // Làm tròn tổng tiền về số nguyên gần nhất
  totalAmount = Math.round(totalAmount);

  return {
    hours,
    totalAmount,
    discountApplied
  };
};

module.exports = calculatePrice;
