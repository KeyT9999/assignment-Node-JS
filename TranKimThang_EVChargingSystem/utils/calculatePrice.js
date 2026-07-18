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
 */ const calculatePrice = ({
  startTime,
  endTime,
  pricePerKwh
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  // Calculate duration in hours (supporting partial/decimal hours)
  const durationMs = end - start;
  const hours = durationMs / (1000 * 60 * 60);
  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }
  let totalCost = 0;
  // 1. Check pricing mode (EV vs Normal)
  // EV charging session formula: total = hours * 15 * pricePerKwh (assuming 15kWh per hour)
  if (process.env.PRICING_MODE === 'EV') {
    totalCost = hours * 15 * pricePerKwh;
  }  else {
    // Normal session formula: total = hours * pricePerHour
    totalCost = hours * pricePerKwh;
  }
  // 2. Check Happy Hour (Off-peak discount)
  let discountApplied = false;
  if (process.env.ENABLE_HAPPY_HOUR === 'true') {
    // Happy Hour conditions: start time is between 22:00 (10 PM) and 04:00 (4 AM)
    const startHour = start.getHours();
    if (startHour >= 22 || startHour < 4) {
      totalCost = totalCost * 0.7;
      // 30% discount
      discountApplied = true;
    }
  }
  // Round price to nearest integer or 2 decimal places depending on requirements (currency format)
  totalCost = Math.round(totalCost);
  return {
    hours,
    totalCost,
    discountApplied
  };
};
module.exports = calculatePrice;
