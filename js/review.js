function formatBookingDate(dateValue) {
  if (!dateValue) return 'Not provided';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleString();
}

function buildBookingSummary(draft) {
  if (!draft) return '<p class="text-secondary">No booking details available.</p>';

  const driverText = draft.needDriver ? 'Yes (+$25)' : 'No';
  return `
    <p><strong>Car:</strong> ${draft.carName || 'Unknown car'}</p>
    <p><strong>Pickup:</strong> ${draft.pickupLocation || 'Not provided'}</p>
    <p><strong>Start:</strong> ${formatBookingDate(draft.startDate)}</p>
    <p><strong>End:</strong> ${formatBookingDate(draft.endDate)}</p>
    <p><strong>Driver:</strong> ${driverText}</p>
    <p><strong>Total:</strong> $${Number(draft.totalPrice || 0).toFixed(2)}</p>
  `;
}

function buildBookingPayload(draft) {
  return {
    user_id: Number(draft.userId || 0),
    car_id: Number(draft.carId || 0),
    start_date: draft.startDate || '',
    end_date: draft.endDate || '',
    pickup_location: draft.pickupLocation || '',
    needs_driver: draft.needDriver ? 1 : 0,
    total_price: Number(draft.totalPrice || 0),
    price_per_day: Number(draft.pricePerDay || 0)
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    buildBookingSummary,
    buildBookingPayload,
    formatBookingDate
  };
}
