const assert = require('assert');
const { buildBookingSummary, buildBookingPayload } = require('../js/review.js');

const draft = {
  userId: 7,
  carId: 12,
  carName: 'BMW X5',
  startDate: '2026-08-01T10:00',
  endDate: '2026-08-03T10:00',
  pickupLocation: 'Nairobi Airport',
  needDriver: true,
  totalPrice: 375
};

const summary = buildBookingSummary(draft);
assert.ok(summary.includes('BMW X5'));
assert.ok(summary.includes('Nairobi Airport'));
assert.ok(summary.includes('$375.00'));

const payload = buildBookingPayload(draft);
assert.strictEqual(payload.user_id, 7);
assert.strictEqual(payload.car_id, 12);
assert.strictEqual(payload.needs_driver, 1);
assert.strictEqual(payload.total_price, 375);

console.log('review flow test passed');
