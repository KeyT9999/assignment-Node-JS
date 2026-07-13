const calculatePrice = ({ startTime, endTime, pricePerUnit }) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const durationMs = end - start;
  const hours = durationMs / (1000 * 60 * 60);

  if (hours <= 0) {
    throw new Error('End time must be after start time');
  }

  let totalAmount = 0;

  if (process.env.PRICING_MODE === 'EV') {
    totalAmount = hours * 15 * pricePerUnit;
  } else {

    totalAmount = hours * pricePerUnit;
  }

  let discountApplied = false;
  if (process.env.ENABLE_HAPPY_HOUR === 'true') {

    const startHour = start.getHours();

    if (startHour >= 22 || startHour < 4) {
      totalAmount = totalAmount * 0.7;
      discountApplied = true;
    }
  }

  totalAmount = Math.round(totalAmount);

  return {
    hours,
    totalAmount,
    discountApplied
  };
};

module.exports = calculatePrice;
