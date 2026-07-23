const assert = require('assert');
const fs = require('fs');

const dashboard = fs.readFileSync('dashboard.html', 'utf8');
const controller = fs.readFileSync('js/dashboard.js', 'utf8');
const bookings = fs.readFileSync('backend/bookings.php', 'utf8');
const db = fs.readFileSync('backend/db.php', 'utf8');

for (const marker of ['customer-feedback-form', 'admin-reports', 'driver-portal', 'company-portal']) {
  assert.ok(dashboard.includes(marker), `missing dashboard capability: ${marker}`);
}
for (const marker of ['payForBooking', 'submitCustomerFeedback', 'updateDriverTripStatus', 'reportVehicleIssue', 'loadCompanyOperations', 'loadAdminReports', 'driver-completed-tasks', 'driver-completed-list']) {
  assert.ok(controller.includes(marker), `missing controller capability: ${marker}`);
}
assert.ok(controller.includes('trip_status ||').valueOf(), 'driver history must use persisted trip status');
for (const marker of ['driver_id', 'trip_status', 'vehicle_issue']) {
  assert.ok(bookings.includes(marker), `missing booking capability: ${marker}`);
  assert.ok(db.includes(marker), `missing schema capability: ${marker}`);
}

console.log('role capability test passed');
