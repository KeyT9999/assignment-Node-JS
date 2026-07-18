/**
 * Calculates rental/session price based on start time, end time, and price per unit.
 * Supports:
 * - Hourly calculations (with decimals)
 * - EV charging multiplier (hourly rate * 15 kWh)
 * - Happy Hour discount (30% discount if starting between 22:00 and 04:00)
 * 
 * @param {Object} params
 * @param {Date|String} params.startTime - Start time of the session
 * @param {Date|String} params.endTime - End time of the session
 * @param {Number} params.pricePerKwh - Price per unit (e.g., price per hour, price per Kwh)
 * @returns {Object} { hours, totalCost, discountApplied }
 */ 
const calculatePrice = ({
  startTime,
  endTime,
  pricePerKwh
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Tính toán thời lượng sạc theo giờ (hỗ trợ số thập phân đầy đủ cho phần lẻ phút)
  const durationMs = end - start;
  const hours = durationMs / (1000 * 60 * 60);
  
  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }
  
  let totalCost = 0;
  
  // 1. Kiểm tra chế độ tính giá (EV so với Normal)
  // Công thức chế độ sạc xe điện EV: tổng tiền = số giờ * hệ số 15 * đơn giá trên Kwh (giả định xe sạc 15kWh mỗi giờ)
  if (process.env.PRICING_MODE === 'EV') {
    totalCost = hours * 15 * pricePerKwh;
  }  else {
    // Công thức tính giá thông thường (phòng/chỗ làm việc): tổng tiền = số giờ * đơn giá theo giờ
    totalCost = hours * pricePerKwh;
  }
  
  // 2. Kiểm tra khung giờ vàng giảm giá (Happy Hour - Giờ thấp điểm)
  let discountApplied = false;
  if (process.env.ENABLE_HAPPY_HOUR === 'true') {
    // Khung giờ vàng giảm giá: Thời điểm bắt đầu sạc nằm trong khoảng từ 22:00 đêm đến 04:00 sáng hôm sau
    const startHour = start.getHours();
    if (startHour >= 22 || startHour < 4) {
      totalCost = totalCost * 0.7; // Giảm giá 30% (chỉ trả 70% tổng tiền ban đầu)
      discountApplied = true;
    }
  }
  
  // Làm tròn tổng chi phí sạc về số nguyên gần nhất
  totalCost = Math.round(totalCost);
  
  return {
    hours,
    totalCost,
    discountApplied
  };
};

module.exports = calculatePrice;

