// Rental price: full days at the daily rate, leftover hours at the hourly
// rate but never more than one extra day.
function calcRental(pickupAt, dropAt, vehicle) {
  const hours = Math.ceil((dropAt - pickupAt) / 36e5);
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  const rentAmount = days * vehicle.pricePerDay + Math.min(remHours * vehicle.pricePerHour, vehicle.pricePerDay);
  const deposit = vehicle.securityDeposit || 0;
  const serviceFee = Math.round(rentAmount * 0.05);
  return { hours, days, remHours, rentAmount, serviceFee, deposit, total: rentAmount + serviceFee + deposit };
}

module.exports = { calcRental };
