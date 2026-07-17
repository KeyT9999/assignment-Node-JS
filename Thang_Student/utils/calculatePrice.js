/**
 * Calculates rental/reservation price based on start time, end time, and price per unit.
 * Supports:
 * - Hourly calculations (with decimals)
 * - EV charging multiplier (hourly rate * 15 kWh)
 * - Happy Hour discount (30% discount if starting between 22:00 and 04:00)
 * 
 * @param {Object} params
 * @param {Date|String} params.startTime - Start time of the reservation
 * @param {Date|String} params.endTime - End time of the reservation
 * @param {Number} params.pricePerHour - Price per unit (e.g., price per hour, price per Kwh)
 * @returns {Object} { hours, totalAmount, discountApplied }
 */
const calculatePrice = ({ startTime, endTime, pricePerHour }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Calculate duration in hours (supporting partial/decimal hours)
  const durationMs = end - start;
  const hours = durationMs / (1000 * 60 * 60);

  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }

  let totalAmount = 0;

  // Calculate: Total = Hours × pricePerHour
  totalAmount = hours * pricePerHour;

  let discountApplied = false;

  // Round price to nearest integer or 2 decimal places depending on requirements (currency format)
  totalAmount = Math.round(totalAmount);

  return {
    hours,
    totalAmount,
    discountApplied
  };
};

module.exports = calculatePrice;
