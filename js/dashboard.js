// `API` is provided by js/api.js (global `window.API`) with a safe fallback.
const API = window.API || window.getApiBase?.() || 'http://127.0.0.1:8000/backend';
window.CUSTOMER_REVIEWS = window.CUSTOMER_REVIEWS || [
  { name: 'Amina K.', rating: 5, quote: 'The booking flow was smooth and the car was spotless. I would rent again.' },
  { name: 'Daniel M.', rating: 5, quote: 'Great selection of premium cars and fast support from the team.' },
  { name: 'Lina R.', rating: 5, quote: 'Loved the home page browsing experience and the wide range of vehicles.' }
];

function getRoleInfo(user) {
  const roleId = Number(user?.role_id ?? user?.role ?? 0);
  const email = String(user?.email || '').toLowerCase();

  if (roleId === 4 || email === 'admin@procar.local') {
    return { id: 4, name: 'admin', label: 'Admin' };
  }
  if (roleId === 3) {
    return { id: 3, name: 'company', label: 'Company' };
  }
  if (roleId === 2) {
    return { id: 2, name: 'driver', label: 'Driver' };
  }
  return { id: 1, name: 'customer', label: 'Customer' };
}

function isAdminUser(user) {
  return getRoleInfo(user).name === 'admin';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let selectedCustomerCar = null;
let pendingBookingDraft = null;
const CUSTOMER_DRIVER_FEE = 25;

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.id) {
    window.location.href = 'auth/login.html';
    return;
  }
  
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
  
  const role = getRoleInfo(user);
  const driverPanel = document.getElementById('driver-tab-li');
  const companyPanel = document.getElementById('company-tab-li');
  const adminPanel = document.getElementById('admin-tab-li');
  const adminNotificationsPanel = document.getElementById('admin-notifications-tab-li');

  if (driverPanel && role.id === 2) {
    driverPanel.style.display = 'block';
  }
  if (companyPanel && role.id === 3) {
    companyPanel.style.display = 'block';
  }
  if (adminPanel && isAdminUser(user)) {
    adminPanel.style.display = 'block';
  }
  if (adminNotificationsPanel && isAdminUser(user)) {
    adminNotificationsPanel.style.display = 'block';
  }

  renderRolePortal(role);
  
  loadUserBookings(user.id);
  loadCars();

  const feedbackPanel = document.getElementById('customer-feedback-panel');
  if (feedbackPanel && role.id === 1) feedbackPanel.classList.remove('d-none');
  const feedbackForm = document.getElementById('customer-feedback-form');
  if (feedbackForm) feedbackForm.addEventListener('submit', submitCustomerFeedback);
  
  if (isAdminUser(user)) {
    loadAdminCars();
    loadAdminBookings();
    loadAdminUsers();
    loadPendingApprovals();
    loadAdminDriverCvs();
    loadAdminReviews();
    loadAdminReports();
    loadAdminPayments();
    loadAdminNotifications();
    window.adminNotificationsTimer = window.setInterval(loadAdminNotifications, 10000);
  }

  if (role.id === 2) {
    loadDriverAssignments(user);
    window.driverAssignmentsTimer = window.setInterval(() => loadDriverAssignments(user), 10000);
  }
  
  // Admin car form
  const adminCarForm = document.getElementById('admin-car-form');
  if (adminCarForm) {
    adminCarForm.addEventListener('submit', handleAdminCarSubmit);
  }

  const customerBookingForm = document.getElementById('customer-booking-form');
  if (customerBookingForm) {
    customerBookingForm.addEventListener('submit', handleCustomerBookingSubmit);
  }

  const customerStart = document.getElementById('customer-start-date');
  const customerEnd = document.getElementById('customer-end-date');
  const customerNeedDriver = document.getElementById('customer-need-driver');
  if (customerStart) customerStart.addEventListener('change', calculateCustomerBookingPrice);
  if (customerEnd) customerEnd.addEventListener('change', calculateCustomerBookingPrice);
  if (customerNeedDriver) customerNeedDriver.addEventListener('change', calculateCustomerBookingPrice);

  const bookingEditBtn = document.getElementById('booking-edit-btn');
  const bookingConfirmBtn = document.getElementById('booking-confirm-btn');
  if (bookingEditBtn) bookingEditBtn.addEventListener('click', showBookingFormStep);
  if (bookingConfirmBtn) bookingConfirmBtn.addEventListener('click', submitCustomerBooking);

  const paymentMethodSelect = document.getElementById('payment-method-select');
  const paymentMethodForm = document.getElementById('payment-method-form');
  if (paymentMethodSelect) paymentMethodSelect.addEventListener('change', syncPaymentReferenceField);
  if (paymentMethodForm) paymentMethodForm.addEventListener('submit', handlePaymentMethodSubmit);
});

async function loadUserBookings(userId) {
  try {
    const res = await fetch(`${API}/bookings.php?user_id=${userId}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    let bookings = await res.json();
    if (!Array.isArray(bookings)) bookings = [];
    
    const list = document.getElementById('bookings-list');
    if (!list) return;
    
    list.innerHTML = '';
    if (bookings.length === 0) {
      list.innerHTML = '<p class="text-secondary">No bookings yet</p>';
      return;
    }
    
    bookings.forEach(booking => {
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card bg-secondary border-secondary">
          <div class="card-body">
            <h5>${booking.make} ${booking.model}</h5>
            <p class="card-text text-secondary">
              <small>${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()}</small>
            </p>
            <p class="card-text">
              <strong class="text-warning">$${booking.total_price}</strong>
              <span class="badge ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}">${booking.status}</span>
            </p>
            ${booking.status === 'pending' ? `
              <button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id}, ${booking.user_id})">Cancel</button>
            ` : ''}
            ${booking.status !== 'cancelled' ? `<button class="btn btn-outline-warning btn-sm ms-2" onclick="payForBooking(${booking.id}, ${Number(booking.total_price || 0)})">Pay</button>` : ''}
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadCars() {
  try {
    const res = await fetch(`${API}/cars_api.php`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    let cars = await res.json();
    if (!Array.isArray(cars)) cars = [];
    
    const list = document.getElementById('cars-list');
    if (!list) return;
    
    list.innerHTML = '';
    cars.forEach(car => {
      const isBooked = Number(car.booked || 0) === 1 || Number(car.available || 1) === 0;
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card bg-secondary border-secondary">
          <div class="card-body">
            <h5>${car.make} ${car.model}</h5>
            <p class="card-text text-secondary"><small>Year: ${car.year} | ${car.category}</small></p>
            <p class="card-text"><strong class="text-warning">$${car.price_per_day}/day</strong></p>
            <div class="mb-2">
              <span class="badge ${isBooked ? 'bg-danger' : 'bg-success'}">${isBooked ? 'Booked' : 'Available'}</span>
            </div>
            ${isBooked ? '<button class="btn btn-secondary btn-sm" disabled>Booked</button>' : `<button class="btn btn-warning text-dark btn-sm book-car-btn" data-car-id="${Number(car.id)}" data-car-make="${escapeHtml(car.make)}" data-car-model="${escapeHtml(car.model)}" data-car-category="${escapeHtml(car.category)}" data-car-price="${Number(car.price_per_day)}">Book</button>`}
          </div>
        </div>
      `;
      list.appendChild(card);

      const bookButton = card.querySelector('.book-car-btn');
      if (bookButton) {
        bookButton.addEventListener('click', () => {
          bookCar(
            Number(bookButton.dataset.carId),
            bookButton.dataset.carMake,
            bookButton.dataset.carModel,
            bookButton.dataset.carCategory,
            Number(bookButton.dataset.carPrice)
          );
        });
      }
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminCars() {
  try {
    const res = await fetch(`${API}/cars_api.php?admin=1`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const cars = await res.json();
    if (!Array.isArray(cars)) cars = [];
    
    const list = document.getElementById('admin-cars-list');
    if (!list) return;
    
    list.innerHTML = '';
    cars.forEach(car => {
      const item = document.createElement('div');
      item.className = 'col-md-6';
      item.innerHTML = `
        <div class="card bg-dark border-secondary p-2">
          <small><strong>${car.make} ${car.model}</strong> - $${car.price_per_day}/day 
          <span class="badge ${car.available ? 'bg-success' : 'bg-danger'}">${car.available ? 'Available' : 'Unavailable'}</span>
          <div class="small text-secondary mt-1">Location: ${car.location || 'Nationwide'}</div>
          <button class="btn btn-sm btn-outline-warning" onclick="editCar(${car.id}, '${car.make}', '${car.model}', ${car.year}, '${car.category}', ${car.price_per_day}, ${car.available}, '${(car.location || 'Nationwide').replace(/'/g, "\\'")}' )">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCar(${car.id})">Delete</button></small>
        </div>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading admin cars:', err);
    const list = document.getElementById('admin-cars-list');
    if (list) list.innerHTML = '<div class="col-12"><p class="text-danger">Error loading cars: ' + err.message + '</p></div>';
  }
}

async function loadAdminBookings() {
  try {
    const res = await fetch(`${API}/bookings.php?admin=1`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    let bookings = await res.json();
    if (!Array.isArray(bookings)) bookings = [];

    const usersRes = await fetch(`${API}/users.php`);
    const users = usersRes.ok ? await usersRes.json() : [];
    const drivers = Array.isArray(users)
      ? users.filter(user => (Number(user.role_id) === 2 || String(user.role || '').toLowerCase() === 'driver') && Number(user.is_active) !== 0)
      : [];
    
    const list = document.getElementById('admin-bookings-list');
    if (!list) return;
    
    list.innerHTML = '';
    bookings.forEach(b => {
      const normalizedStatus = String(b.status || '').toLowerCase();
      const isConfirmed = normalizedStatus === 'confirmed';
      const statusLabel = normalizedStatus === 'driver_requested' ? 'Driver requested' : normalizedStatus === 'driver_assigned' ? 'Driver assigned' : normalizedStatus === 'driver_accepted' ? 'Driver accepted' : normalizedStatus === 'driver_rejected' ? 'Driver rejected' : normalizedStatus === 'confirmed' ? 'Confirmed' : normalizedStatus || 'Pending';
      const assignedDriverName = b.driver_name ? escapeHtml(b.driver_name) : 'None';
      const pickupLocation = escapeHtml(b.pickup_location || 'Not provided');
      const driverResponse = b.driver_response ? `<div class="small text-warning mt-2">Driver response: ${escapeHtml(b.driver_response)}</div>` : '';
      const vehicleIssue = b.vehicle_issue ? `<div class="small text-danger mt-2"><strong>Vehicle issue:</strong> ${escapeHtml(b.vehicle_issue)}</div>` : '';
      const driverOptions = drivers.length
        ? drivers.map(driver => `<option value="${driver.id}" ${Number(b.driver_id) === Number(driver.id) ? 'selected' : ''}>${escapeHtml(driver.name || 'Driver')}</option>`).join('')
        : '<option value="">No approved drivers</option>';
      const actions = isConfirmed
        ? '<span class="badge bg-success">Confirmed</span>'
        : `
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-sm btn-outline-warning" onclick="assignDriverToBooking(${b.id})">Assign</button>
            <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${b.id}, 'confirmed')">Confirm</button>
          </div>
        `;
      const item = document.createElement('div');
      item.className = 'col-md-6';
      item.innerHTML = `
        <div class="card bg-secondary border-secondary p-3">
          <small><strong>${escapeHtml(b.make || '')} ${escapeHtml(b.model || '')}</strong> - ${escapeHtml(b.name || 'Customer')} (${escapeHtml(b.email || 'N/A')})<br>
          ${new Date(b.start_date).toLocaleDateString()} to ${new Date(b.end_date).toLocaleDateString()}<br>
          Pickup: ${pickupLocation}<br>
          Assigned driver: ${assignedDriverName}<br>
          Total: $${Number(b.total_price || 0).toFixed(2)} - Status: <strong class="text-warning">${escapeHtml(statusLabel)}</strong></small>
          <div class="mt-2">
            <label class="form-label small mb-1">Choose Driver</label>
            <select id="admin-driver-select-${b.id}" class="form-select form-select-sm bg-dark text-light border-secondary">
              <option value="">Select driver</option>
              ${driverOptions}
            </select>
          </div>
          ${driverResponse}
          ${vehicleIssue}
          ${actions}
        </div>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    console.error('Error loading admin bookings:', err);
    const list = document.getElementById('admin-bookings-list');
    if (list) list.innerHTML = '<div class="col-12"><p class="text-danger">Error loading bookings: ' + err.message + '</p></div>';
  }
}

async function loadAdminNotifications() {
  const container = document.getElementById('admin-notifications-list');
  if (!container) return;

  try {
    const response = await fetch(`${API}/bookings.php?admin=1`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Notifications API: ${response.status}`);
    const bookings = await response.json();
    const notifications = (Array.isArray(bookings) ? bookings : []).flatMap(booking => {
      const items = [];
      const car = `${booking.make || ''} ${booking.model || ''}`.trim() || `Booking #${booking.id}`;
      const driver = booking.driver_name || 'Assigned driver';
      if (String(booking.status || '').toLowerCase() === 'driver_accepted') {
        items.push({ type: 'success', title: 'Assignment accepted', message: `${driver} accepted the ${car} assignment.`, key: `accepted-${booking.id}-${booking.status}` });
      }
      if (booking.vehicle_issue) {
        items.push({ type: 'danger', title: 'Vehicle issue reported', message: `${driver} reported an issue for ${car}: ${booking.vehicle_issue}`, key: `issue-${booking.id}-${booking.vehicle_issue}` });
      }
      return items;
    });

    const notificationKeys = notifications.map(notification => notification.key);
    const storedKeys = sessionStorage.getItem('procar-admin-notification-keys');
    const knownKeys = storedKeys ? JSON.parse(storedKeys) : null;
    if (knownKeys) {
      const newNotifications = notifications.filter(notification => !knownKeys.includes(notification.key));
      if (newNotifications.length) {
        window.alert(newNotifications.map(notification => `${notification.title}: ${notification.message}`).join('\n'));
      }
    }
    sessionStorage.setItem('procar-admin-notification-keys', JSON.stringify(notificationKeys));
    const count = document.getElementById('admin-notification-count');
    if (count) count.textContent = String(notifications.length);

    if (!notifications.length) {
      container.innerHTML = '<div class="alert alert-secondary py-2 mb-0">No new driver notifications.</div>';
      return;
    }

    const markup = notifications.map(notification => `
      <div class="alert alert-${notification.type} d-flex justify-content-between align-items-start gap-3" role="alert">
        <div><strong>${escapeHtml(notification.title)}</strong><br><span>${escapeHtml(notification.message)}</span></div>
        <button type="button" class="btn-close" aria-label="Dismiss notification"></button>
      </div>
    `).join('');
    container.innerHTML = markup;
    container.querySelectorAll('.btn-close').forEach(button => {
      button.addEventListener('click', () => button.closest('.alert')?.remove());
    });
  } catch (error) {
    console.error('Error loading admin notifications:', error);
    container.innerHTML = '<div class="alert alert-danger py-2 mb-0">Unable to load driver notifications.</div>';
  }
}

async function loadAdminUsers() {
  try {
    const res = await fetch(`${API}/users.php`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const text = await res.text();
    let users = [];
    try {
      users = JSON.parse(text) || [];
    } catch (parseErr) {
      console.error('Failed to parse users response:', parseErr, text);
      throw new Error('Invalid users response from server');
    }
    
    const list = document.getElementById('admin-users-list');
    if (!list) return;
    
    list.innerHTML = '';
    if (!Array.isArray(users) || users.length === 0) {
      list.innerHTML = '<div class="col-12"><p class="text-secondary">No users found.</p></div>';
      return;
    }

    users.forEach(user => {
      const card = document.createElement('div');
      card.className = 'col-md-6';
      const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
      const statusText = Number(user.is_active) === 0 ? 'Pending Approval' : 'Approved';
      const badgeClass = Number(user.is_active) === 0 ? 'bg-warning text-dark' : 'bg-success';
      const cvLink = user.cv_path ? `<a href="${user.cv_path}" target="_blank" class="btn btn-sm btn-outline-warning mt-2">View CV</a>` : '';
      card.innerHTML = `
        <div class="card bg-dark border-secondary p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-1">${user.name}</h6>
              <small class="text-secondary">${user.email}</small>
            </div>
            <span class="badge ${badgeClass}">${statusText}</span>
          </div>
          <p class="small text-secondary mb-2">Registered as: <strong class="text-warning">${roleLabel}</strong></p>
          <p class="small text-secondary mb-3">Phone: ${user.phone || 'N/A'}</p>
          ${cvLink}
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    const list = document.getElementById('admin-users-list');
    if (list) list.innerHTML = '<div class="col-12"><p class="text-danger">Error loading users: ' + err.message + '</p></div>';
  }
}

async function loadPendingApprovals() {
  try {
    const res = await fetch(`${API}/users.php`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const text = await res.text();
    let users = [];
    try {
      users = JSON.parse(text) || [];
    } catch (parseErr) {
      console.error('Failed to parse pending approvals response:', parseErr, text);
      throw new Error('Invalid users response from server');
    }
    
    const list = document.getElementById('admin-pending-list');
    if (!list) return;
    
    list.innerHTML = '';
    const pendingUsers = Array.isArray(users) ? users.filter(user => Number(user.is_active) === 0) : [];
    if (pendingUsers.length === 0) {
      list.innerHTML = '<div class="col-12"><p class="text-secondary">No pending approvals.</p></div>';
      return;
    }

    pendingUsers.forEach(user => {
      const card = document.createElement('div');
      card.className = 'col-md-6';
      const roleLabel = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
      const cvLink = user.cv_path ? `<a href="${user.cv_path}" target="_blank" class="btn btn-sm btn-outline-warning mb-2">View CV</a>` : '';
      card.innerHTML = `
        <div class="card bg-dark border-secondary p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-1">${user.name}</h6>
              <small class="text-secondary">${user.email}</small>
            </div>
            <span class="badge bg-warning text-dark">Pending</span>
          </div>
          <p class="small text-secondary mb-2">Registered as: <strong class="text-warning">${roleLabel}</strong></p>
          <p class="small text-secondary mb-3">Phone: ${user.phone || 'N/A'}</p>
          ${cvLink}
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-success" onclick="approveUser(${user.id})">Approve</button>
            <button class="btn btn-sm btn-outline-warning" onclick="rejectUser(${user.id})">Reject</button>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    const list = document.getElementById('admin-pending-list');
    if (list) list.innerHTML = '<div class="col-12"><p class="text-danger">Error loading pending approvals: ' + err.message + '</p></div>';
  }
}

async function loadAdminDriverCvs() {
  const list = document.getElementById('admin-driver-cvs-list');
  if (!list) return;

  try {
    const res = await fetch(`${API}/users.php`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const users = await res.json();
    const drivers = Array.isArray(users)
      ? users.filter(user => Number(user.role_id) === 2 || String(user.role || '').toLowerCase() === 'driver')
      : [];

    list.innerHTML = '';
    if (!drivers.length) {
      list.innerHTML = '<div class="col-12"><p class="text-secondary">No driver CVs found.</p></div>';
      return;
    }

    drivers.forEach(driver => {
      const cvPath = String(driver.cv_path || '').trim();
      const status = Number(driver.is_active) === 0 ? 'Pending Approval' : 'Approved';
      const badge = Number(driver.is_active) === 0 ? 'bg-warning text-dark' : 'bg-success';
      const card = document.createElement('div');
      card.className = 'col-md-6 col-lg-4';
      card.innerHTML = `
        <div class="card bg-dark border-secondary h-100 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <div>
              <h6 class="mb-1">${escapeHtml(driver.name || 'Unnamed driver')}</h6>
              <small class="text-secondary">${escapeHtml(driver.email || 'No email')}</small>
            </div>
            <span class="badge ${badge}">${status}</span>
          </div>
          <p class="small text-secondary mb-2">Phone: ${escapeHtml(driver.phone || 'N/A')}</p>
          <p class="small text-secondary text-break mb-3">Stored file: ${escapeHtml(cvPath || 'No CV uploaded')}</p>
          ${cvPath ? `<a class="btn btn-sm btn-outline-warning" href="${escapeHtml(cvPath)}" target="_blank" rel="noopener">View CV</a>` : ''}
        </div>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading driver CVs:', err);
    list.innerHTML = '<div class="col-12"><p class="text-danger">Error loading driver CVs: ' + escapeHtml(err.message) + '</p></div>';
  }
}

async function loadAdminReviews() {
  const list = document.getElementById('admin-reviews-list');
  if (!list) return;

  let reviews = [];
  try {
    const response = await fetch(`${API}/reviews.php`, { cache: 'no-store' });
    reviews = response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Unable to load persisted reviews:', error);
  }
  if (!Array.isArray(reviews) || !reviews.length) {
    reviews = Array.isArray(window.CUSTOMER_REVIEWS) ? window.CUSTOMER_REVIEWS : [];
  }
  list.innerHTML = '';
  if (!reviews.length) {
    list.innerHTML = '<div class="col-12"><p class="text-secondary">No customer reviews found.</p></div>';
    return;
  }

  reviews.forEach(review => {
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card bg-dark border-secondary h-100 p-3">
        <div class="text-warning mb-2" aria-label="${rating} out of 5 stars">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
        <p class="mb-3">“${escapeHtml(review.comment || review.quote || '')}”</p>
        <h6 class="mb-0 text-light">${escapeHtml(review.name || 'Anonymous customer')}</h6>
      </div>
    `;
    list.appendChild(card);
  });
}

async function approveUser(userId) {
  try {
    const res = await fetch(`${API}/users.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, is_active: 1 })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'User approved successfully.');
      loadAdminUsers();
      loadPendingApprovals();
    }
  } catch (err) {
    console.error(err);
  }
}

async function rejectUser(userId) {
  try {
    const res = await fetch(`${API}/users.php`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, action: 'reject' })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || 'Driver rejected and removed.');
      loadAdminUsers();
      loadPendingApprovals();
      loadAdminDriverCvs();
    }
  } catch (err) {
    console.error(err);
  }
}

function editCar(id, make, model, year, category, price, available, location) {
  document.getElementById('admin-car-id').value = id;
  document.getElementById('admin-make').value = make;
  document.getElementById('admin-model').value = model;
  document.getElementById('admin-year').value = year;
  document.getElementById('admin-category').value = category;
  document.getElementById('admin-price').value = price;
  document.getElementById('admin-location').value = location || '';
  document.getElementById('admin-available').checked = available;
}

async function handleAdminCarSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('admin-car-id').value;
  const make = document.getElementById('admin-make').value;
  const model = document.getElementById('admin-model').value;
  const year = document.getElementById('admin-year').value;
  const category = document.getElementById('admin-category').value;
  const price = document.getElementById('admin-price').value;
  const location = document.getElementById('admin-location').value;
  const available = document.getElementById('admin-available').checked ? 1 : 0;
  
  const payload = { make, model, year, category, price_per_day: price, available, location };
  const method = id ? 'PUT' : 'POST';
  if (id) payload.id = id;
  
  try {
    const res = await fetch(`${API}/cars_api.php`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    if (data) {
      document.getElementById('admin-car-form').reset();
      loadAdminCars();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteCar(id) {
  if (!confirm('Delete this car?')) return;
  try {
    const res = await fetch(`${API}/cars_api.php`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if (res.ok) loadAdminCars();
  } catch (err) {
    console.error(err);
  }
}

async function cancelBooking(bookingId, userId) {
  if (!confirm('Cancel this booking?')) return;
  try {
    const res = await fetch(`${API}/bookings.php`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, user_id: userId })
    });
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      loadUserBookings(user.id);
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateBookingStatus(bookingId, status, driverId = null, driverResponse = null, tripStatus = null, vehicleIssue = null) {
  try {
    const payload = { id: bookingId, status };
    if (driverId !== null) payload.driver_id = driverId;
    if (driverResponse !== null) payload.driver_response = driverResponse;
    if (tripStatus !== null) payload.trip_status = tripStatus;
    if (vehicleIssue !== null) payload.vehicle_issue = vehicleIssue;

    const res = await fetch(`${API}/bookings.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = getRoleInfo(user);
      if (role.name === 'admin') {
        loadAdminBookings();
      } else if (role.name === 'driver') {
        loadDriverAssignments(user);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function assignDriverToBooking(bookingId) {
  const select = document.getElementById(`admin-driver-select-${bookingId}`);
  const driverId = select?.value;
  if (!driverId) {
    alert('Please select a driver first.');
    return;
  }
  updateBookingStatus(bookingId, 'driver_assigned', driverId);
}

let activePaymentBookingId = null;

function syncPaymentReferenceField() {
  const select = document.getElementById('payment-method-select');
  const label = document.getElementById('payment-reference-label');
  const input = document.getElementById('payment-reference-input');
  if (!select || !label || !input) return;

  const method = select.value;
  if (method === 'cash') {
    label.textContent = 'Cash note';
    input.placeholder = 'Optional note for the payment';
    input.required = false;
    return;
  }
  if (method === 'mpesa') {
    label.textContent = 'Phone number';
    input.placeholder = 'Enter the M-Pesa phone number';
    input.required = true;
    return;
  }
  if (method === 'paypal') {
    label.textContent = 'PayPal email';
    input.placeholder = 'Enter the PayPal email address';
    input.required = true;
    return;
  }

  label.textContent = method === 'visa' ? 'Visa card number' : 'Card number';
  input.placeholder = method === 'visa' ? 'Enter the visa number' : 'Enter the card number';
  input.required = true;
}

function openPaymentMethodModal(bookingId, amount) {
  activePaymentBookingId = Number(bookingId);
  const modalEl = document.getElementById('paymentMethodModal');
  const bookingIdInput = document.getElementById('payment-booking-id');
  const amountEl = document.getElementById('payment-modal-amount');
  const select = document.getElementById('payment-method-select');
  const input = document.getElementById('payment-reference-input');
  const form = document.getElementById('payment-method-form');

  if (bookingIdInput) bookingIdInput.value = String(activePaymentBookingId);
  if (amountEl) amountEl.textContent = `$${Number(amount || 0).toFixed(2)}`;
  if (select) select.value = '';
  if (input) input.value = '';
  if (form) form.reset();
  syncPaymentReferenceField();

  if (modalEl && window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

async function handlePaymentMethodSubmit(event) {
  event.preventDefault();
  const method = document.getElementById('payment-method-select')?.value?.trim().toLowerCase();
  const reference = document.getElementById('payment-reference-input')?.value?.trim() || '';
  const amount = Number(document.getElementById('payment-modal-amount')?.textContent?.replace(/[^\d.]/g, '') || 0);

  if (!method) {
    alert('Please select a payment method.');
    return;
  }

  if (method !== 'cash' && !reference) {
    alert('Please enter the required reference details for this payment method.');
    return;
  }

  if (method === 'mpesa' && !/^\+?\d{10,15}$/.test(reference)) {
    alert('Please enter a valid M-Pesa phone number.');
    return;
  }

  if ((method === 'card' || method === 'visa') && !/^\d{12,19}$/.test(reference)) {
    alert('Please enter a valid card or visa number.');
    return;
  }

  try {
    const response = await fetch(`${API}/payments.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: activePaymentBookingId,
        amount,
        method,
        payment_reference: reference
      })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Payment failed: ${response.status}`);
    }

    const modalEl = document.getElementById('paymentMethodModal');
    if (modalEl && window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    }
    alert(`Payment recorded successfully using ${method}.`);
  } catch (error) {
    alert(error.message);
  }
}

function payForBooking(bookingId, amount) {
  openPaymentMethodModal(bookingId, amount);
}

async function submitCustomerFeedback(event) {
  event.preventDefault();
  const rating = document.getElementById('customer-feedback-rating').value;
  const comment = document.getElementById('customer-feedback-comment').value.trim();
  try {
    const response = await fetch(`${API}/reviews.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment })
    });
    if (!response.ok) throw new Error('Unable to submit feedback.');
    event.target.reset();
    alert('Thank you for your feedback.');
  } catch (error) {
    alert(error.message);
  }
}

async function loadAdminReports() {
  const container = document.getElementById('admin-reports-content');
  if (!container) return;
  try {
    const response = await fetch(`${API}/reports.php`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Reports API: ${response.status}`);
    const report = await response.json();
    container.innerHTML = [
      ['Users', report.users], ['Vehicles', report.cars], ['Bookings', report.bookings],
      ['Payments', report.payments], ['Revenue', `$${Number(report.revenue || 0).toFixed(2)}`]
    ].map(([label, value]) => `<div class="col-sm-6 col-lg-3"><div class="card bg-dark border-secondary p-3"><div class="text-secondary small">${label}</div><strong class="text-warning fs-4">${escapeHtml(value)}</strong></div></div>`).join('');
  } catch (error) {
    container.innerHTML = `<div class="col-12 text-danger">Unable to load reports: ${escapeHtml(error.message)}</div>`;
  }
}

async function loadAdminPayments() {
  const list = document.getElementById('admin-payments-list');
  if (!list) return;
  try {
    const response = await fetch(`${API}/payments.php?admin=1`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Payments API: ${response.status}`);
    const payments = await response.json();
    list.innerHTML = (Array.isArray(payments) ? payments : []).map(payment => `
      <div class="col-md-6 col-lg-4"><div class="card bg-dark border-secondary p-3">
        <strong>Booking #${escapeHtml(payment.booking_id)}</strong>
        <span class="text-warning">$${Number(payment.amount || 0).toFixed(2)}</span>
        <span class="small text-secondary">${escapeHtml(payment.method || 'offline')} • ${escapeHtml(payment.status || 'unknown')}</span>
      </div></div>
    `).join('') || '<div class="col-12 text-secondary">No payment transactions found.</div>';
  } catch (error) {
    list.innerHTML = `<div class="col-12 text-danger">Unable to load payments: ${escapeHtml(error.message)}</div>`;
  }
}

async function openCompanyInventory() {
  const operations = document.getElementById('company-operations');
  if (!operations) return;
  operations.innerHTML = '<div class="text-secondary">Loading inventory...</div>';
  try {
    const response = await fetch(`${API}/cars_api.php?admin=1`, { cache: 'no-store' });
    const cars = response.ok ? await response.json() : [];
    operations.innerHTML = `<div class="row g-2">${(Array.isArray(cars) ? cars : []).slice(0, 12).map(car => `<div class="col-md-6"><div class="border border-secondary rounded p-2"><strong>${escapeHtml(car.make)} ${escapeHtml(car.model)}</strong><br><span class="text-warning">$${Number(car.price_per_day || 0).toFixed(2)}/day</span> <span class="text-secondary">${escapeHtml(car.location || 'Nairobi')}</span></div></div>`).join('')}</div>`;
  } catch (error) {
    operations.innerHTML = `<div class="text-danger">Unable to load inventory: ${escapeHtml(error.message)}</div>`;
  }
}

async function loadCompanyOperations() {
  const operations = document.getElementById('company-operations');
  if (!operations) return;
  try {
    const [bookingsResponse, reportsResponse] = await Promise.all([
      fetch(`${API}/bookings.php?admin=1`, { cache: 'no-store' }),
      fetch(`${API}/reports.php`, { cache: 'no-store' })
    ]);
    const bookings = bookingsResponse.ok ? await bookingsResponse.json() : [];
    const report = reportsResponse.ok ? await reportsResponse.json() : {};
    operations.innerHTML = `<div class="mb-2"><strong class="text-warning">Operations summary</strong>: ${report.bookings || 0} bookings, ${report.cars || 0} vehicles, ${report.users || 0} users.</div><div class="text-secondary">Recent booking inquiries</div>${(Array.isArray(bookings) ? bookings : []).slice(0, 5).map(booking => `<div class="border-bottom border-secondary py-2">${escapeHtml(booking.name || 'Customer')} requested ${escapeHtml(booking.make || '')} ${escapeHtml(booking.model || '')} <span class="text-warning">(${escapeHtml(booking.status || 'pending')})</span></div>`).join('') || '<div class="text-secondary py-2">No booking inquiries.</div>'}`;
  } catch (error) {
    operations.innerHTML = `<div class="text-danger">Unable to load operations: ${escapeHtml(error.message)}</div>`;
  }
}

function renderRolePortal(role) {
  const driverContent = document.getElementById('driver-portal-content');
  const companyContent = document.getElementById('company-portal-content');

  if (driverContent) {
    driverContent.innerHTML = role.id === 2 ? `
      <h5 class="mb-3 text-warning">Driver workspace</h5>
      <p class="text-secondary mb-3">Review assigned bookings, inspect customer info, and respond to new assignments.</p>
      <ul class="nav nav-pills mb-3" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="pill" data-bs-target="#driver-active-tasks" type="button">Active Tasks</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="pill" data-bs-target="#driver-completed-tasks" type="button">Completed Tasks</button></li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="driver-active-tasks"><div id="driver-assignments-list"></div></div>
        <div class="tab-pane fade" id="driver-completed-tasks"><div id="driver-completed-list"></div></div>
      </div>
    ` : '<p class="text-secondary mb-0">Driver tools will appear when a driver account is active.</p>';
  }

  if (companyContent) {
    companyContent.innerHTML = role.id === 3 ? `
      <h5 class="mb-3 text-warning">Company workspace</h5>
      <p class="text-secondary mb-3">You can manage inventory, pricing, bookings, drivers, and customer inquiries from this area.</p>
      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="card bg-dark border-secondary p-3 h-100">
            <h6 class="text-warning">Vehicle inventory and pricing</h6>
            <p class="small text-secondary mb-0">Manage vehicles, rental prices, availability, and records.</p>
            <button class="btn btn-sm btn-outline-warning mt-2" onclick="openCompanyInventory()">Open inventory</button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-dark border-secondary p-3 h-100">
            <h6 class="text-warning">Bookings and drivers</h6>
            <p class="small text-secondary mb-0">Monitor rentals, assign approved drivers, and handle inquiries.</p>
            <button class="btn btn-sm btn-outline-warning mt-2" onclick="loadCompanyOperations()">Refresh operations</button>
          </div>
        </div>
      </div>
      <div id="company-operations" class="small text-light"></div>
    ` : '<p class="text-secondary mb-0">Company tools will appear when a company account is active.</p>';

    if (role.id === 3) loadCompanyOperations();
  }
}

async function loadDriverAssignments(user) {
  const container = document.getElementById('driver-assignments-list');
  const completedContainer = document.getElementById('driver-completed-list');
  if (!container || !completedContainer) return;

  try {
    const res = await fetch(`${API}/bookings.php?driver=1`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const bookings = await res.json();
    const list = Array.isArray(bookings) ? bookings : [];

    const completed = list.filter(booking => String(booking.trip_status || '').toLowerCase() === 'completed');
    const active = list.filter(booking => String(booking.trip_status || '').toLowerCase() !== 'completed');
    const renderBooking = (booking, isCompleted = false) => `
      <div class="card bg-dark border-secondary p-3 mb-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <h6 class="mb-1 text-warning">${escapeHtml(booking.make || '')} ${escapeHtml(booking.model || '')}</h6>
            <div class="small text-secondary">${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()}</div>
          </div>
          <span class="badge ${booking.status === 'driver_accepted' ? 'bg-success' : booking.status === 'driver_rejected' ? 'bg-danger' : 'bg-warning text-dark'}">${escapeHtml(booking.status || 'pending')}</span>
        </div>
        <div class="mt-3 small text-light">
          <div><strong>Customer:</strong> ${escapeHtml(booking.name || 'N/A')}</div>
          <div><strong>Email:</strong> ${escapeHtml(booking.email || 'N/A')}</div>
          <div><strong>Phone:</strong> ${escapeHtml(booking.phone || 'N/A')}</div>
          <div><strong>Pickup:</strong> ${escapeHtml(booking.pickup_location || 'Not provided')}</div>
          <div><strong>Trip status:</strong> ${escapeHtml(booking.trip_status || 'not_started')}</div>
          ${booking.vehicle_issue ? `<div class="mt-2 text-danger"><strong>Vehicle issue:</strong> ${escapeHtml(booking.vehicle_issue)}</div>` : ''}
          ${booking.driver_response ? `<div class="mt-2 text-warning"><strong>Admin response:</strong> ${escapeHtml(booking.driver_response)}</div>` : ''}
        </div>
        ${isCompleted ? '<span class="badge bg-success">Completed task</span>' : booking.status === 'driver_accepted' ? `
          <div class="mt-3 d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-success" onclick="updateDriverTripStatus(${booking.id}, 'started')">Start trip</button>
            <button class="btn btn-sm btn-outline-success" onclick="updateDriverTripStatus(${booking.id}, 'completed')">Complete trip</button>
            <button class="btn btn-sm btn-outline-warning" onclick="reportVehicleIssue(${booking.id})">Report vehicle issue</button>
          </div>
        ` : booking.status === 'driver_rejected' ? '' : `
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-sm btn-success" onclick="acceptDriverAssignment(${booking.id})">Accept</button>
            <button class="btn btn-sm btn-outline-warning" onclick="toggleDriverRejectForm(${booking.id})">Reject</button>
          </div>
          <form class="mt-2 d-none" id="reject-form-${booking.id}" onsubmit="event.preventDefault(); submitDriverRejection(${booking.id});">
            <label class="form-label small">Reason you are not available</label>
            <textarea id="driver-reason-${booking.id}" class="form-control form-control-sm bg-secondary text-light border-secondary" rows="3" placeholder="Explain why you cannot take this trip"></textarea>
            <label class="form-label small mt-2">Vehicle issue report</label>
            <textarea id="driver-issue-${booking.id}" class="form-control form-control-sm bg-secondary text-light border-secondary" rows="2" placeholder="Report any vehicle issue"></textarea>
            <button type="submit" class="btn btn-sm btn-warning text-dark mt-2">Send to Admin</button>
          </form>
        `}
      </div>
    `;
    container.innerHTML = active.length
      ? active.map(booking => renderBooking(booking)).join('')
      : '<div class="text-secondary">No active assigned trips.</div>';
    completedContainer.innerHTML = completed.length
      ? completed.map(booking => renderBooking(booking, true)).join('')
      : '<div class="text-secondary">No completed tasks yet.</div>';
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="text-danger">Unable to load assigned trips.</div>';
  }
}

function toggleDriverRejectForm(bookingId) {
  const form = document.getElementById(`reject-form-${bookingId}`);
  if (form) form.classList.toggle('d-none');
}

async function acceptDriverAssignment(bookingId) {
  await updateBookingStatus(bookingId, 'driver_accepted');
}

async function updateDriverTripStatus(bookingId, tripStatus) {
  await updateBookingStatus(bookingId, 'driver_accepted', null, null, tripStatus);
}

async function reportVehicleIssue(bookingId) {
  const issue = prompt('Describe the vehicle issue:');
  if (!issue || !issue.trim()) return;
  await updateBookingStatus(bookingId, 'driver_accepted', null, null, null, issue.trim());
}

async function submitDriverRejection(bookingId) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const reason = document.getElementById(`driver-reason-${bookingId}`)?.value?.trim() || 'No reason provided.';
  const issue = document.getElementById(`driver-issue-${bookingId}`)?.value?.trim() || 'No vehicle issue reported.';
  const response = `${user.name || 'A driver'} rejected the assignment. Reason: ${reason} Vehicle issue: ${issue}`;
  await updateBookingStatus(bookingId, 'driver_rejected', null, response);
  alert('Your rejection report has been sent to the admin.');
}

function bookCar(carId, make, model, category, pricePerDay) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = 'auth/login.html';
    return;
  }

  selectedCustomerCar = { id: carId, make, model, category, pricePerDay };
  pendingBookingDraft = null;
  document.getElementById('customer-booking-car-id').value = carId;
  document.getElementById('customer-booking-form').reset();
  document.getElementById('customer-total-price').textContent = '$0';
  showBookingFormStep();
  const modal = new bootstrap.Modal(document.getElementById('customerBookingModal'));
  modal.show();
}

function showBookingFormStep() {
  const formStep = document.getElementById('booking-form-step');
  const reviewStep = document.getElementById('booking-review-step');
  if (formStep) formStep.classList.remove('d-none');
  if (reviewStep) reviewStep.classList.add('d-none');
}

function calculateCustomerBookingPrice() {
  if (!selectedCustomerCar) return;

  const start = new Date(document.getElementById('customer-start-date').value);
  const end = new Date(document.getElementById('customer-end-date').value);
  const needDriver = document.getElementById('customer-need-driver').checked;

  if (start && end && end > start) {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const basePrice = days * Number(selectedCustomerCar.pricePerDay || 0);
    const total = basePrice + (needDriver ? CUSTOMER_DRIVER_FEE : 0);
    document.getElementById('customer-total-price').textContent = `$${total.toFixed(2)}`;
  }
}

async function handleCustomerBookingSubmit(e) {
  e.preventDefault();
  submitCustomerBooking();
}

async function submitCustomerBooking() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const startDate = document.getElementById('customer-start-date').value;
  const endDate = document.getElementById('customer-end-date').value;
  const pickupLocation = document.getElementById('customer-pickup-location').value;
  const needDriver = document.getElementById('customer-need-driver').checked;
  const totalPriceText = document.getElementById('customer-total-price').textContent.replace('$', '');

  if (!selectedCustomerCar) {
    alert('Please choose a car first.');
    return;
  }

  pendingBookingDraft = {
    userId: user.id,
    carId: selectedCustomerCar.id,
    carName: `${selectedCustomerCar.make} ${selectedCustomerCar.model}`,
    startDate,
    endDate,
    pickupLocation,
    needDriver,
    totalPrice: Number(totalPriceText || 0),
    pricePerDay: Number(selectedCustomerCar.pricePerDay || 0)
  };

  localStorage.setItem('bookingReviewDraft', JSON.stringify(pendingBookingDraft));
  window.location.href = 'review.html';
}
