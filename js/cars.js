const DEMO_CARS = [
  { id: 1, make: 'Toyota', model: 'Corolla', year: 2023, category: 'Economy', price_per_day: 55, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80' },
  { id: 2, make: 'Toyota', model: 'Premio', year: 2022, category: 'Sedan', price_per_day: 58, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=900&q=80' },
  { id: 3, make: 'Honda', model: 'Fit', year: 2021, category: 'Economy', price_per_day: 52, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80' },
  { id: 4, make: 'Mercedes', model: 'C-Class', year: 2024, category: 'Luxury', price_per_day: 120, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { id: 5, make: 'Nissan', model: 'March', year: 2020, category: 'Economy', price_per_day: 47, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80' },
  { id: 6, make: 'Mazda', model: 'Axela', year: 2021, category: 'Sedan', price_per_day: 57, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80' },
  { id: 7, make: 'Subaru', model: 'Impreza', year: 2020, category: 'Hatchback', price_per_day: 60, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80' },
  { id: 8, make: 'BMW', model: '320i', year: 2022, category: 'Luxury', price_per_day: 140, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80' },
  { id: 9, make: 'Ford', model: 'Ranger', year: 2021, category: 'Pickup', price_per_day: 85, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80' },
  { id: 10, make: 'Tesla', model: 'Model 3', year: 2023, category: 'Electric', price_per_day: 125, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' },
  { id: 11, make: 'Toyota', model: 'Camry', year: 2024, category: 'Sedan', price_per_day: 71, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80' },
  { id: 12, make: 'Honda', model: 'Civic', year: 2023, category: 'Sedan', price_per_day: 63, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80' },
  { id: 13, make: 'Lexus', model: 'ES 300h', year: 2024, category: 'Hybrid', price_per_day: 115, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80' },
  { id: 14, make: 'Jeep', model: 'Wrangler', year: 2023, category: 'SUV', price_per_day: 110, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80' },
  { id: 15, make: 'Kia', model: 'Sportage', year: 2024, category: 'SUV', price_per_day: 90, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80' },
  { id: 16, make: 'Mini', model: 'Cooper', year: 2023, category: 'Convertible', price_per_day: 112, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80' },
  { id: 17, make: 'Mercedes', model: 'GLC', year: 2023, category: 'Luxury', price_per_day: 175, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { id: 18, make: 'BMW', model: 'X5', year: 2024, category: 'SUV', price_per_day: 170, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80' },
  { id: 19, make: 'Audi', model: 'A3', year: 2023, category: 'Luxury', price_per_day: 155, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=900&q=80' },
  { id: 20, make: 'Tesla', model: 'Model Y', year: 2024, category: 'Electric', price_per_day: 148, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' },
  { id: 21, make: 'Toyota', model: 'Highlander', year: 2024, category: 'SUV', price_per_day: 113, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80' },
  { id: 22, make: 'Ford', model: 'F-150', year: 2024, category: 'Pickup', price_per_day: 190, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80' },
  { id: 23, make: 'Mercedes', model: 'V-Class', year: 2024, category: 'Van', price_per_day: 205, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { id: 24, make: 'BYD', model: 'Seal', year: 2024, category: 'Electric', price_per_day: 145, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' }
];

// `API` is provided by js/api.js (global `window.API`)
let selectedCar = null;

const FEATURED_CATEGORY_SET = new Set(['Luxury', 'Electric', 'Hybrid', 'SUV', 'Convertible', 'Pickup', 'Executive']);

function isFeaturedCar(car) {
  const category = String(car.category || '').trim();
  const price = Number(car.price_per_day || 0);
  const year = Number(car.year || 0);
  return FEATURED_CATEGORY_SET.has(category) || price >= 100 || year >= 2024;
}

function getCarDisplayName(car) {
  return `${car.make || ''} ${car.model || ''}`.trim();
}

function getVisibleCars(cars, category = '', search = '', sortValue = 'featured') {
  const normalizedCategory = String(category || '').trim().toLowerCase();
  const normalizedSearch = String(search || '').trim().toLowerCase();
  let filtered = Array.isArray(cars) ? cars : [];

  if (normalizedCategory) {
    filtered = filtered.filter((car) => String(car.category || '').trim().toLowerCase() === normalizedCategory);
  }

  if (normalizedSearch) {
    filtered = filtered.filter((car) => {
      const haystack = [
        car.make,
        car.model,
        car.category,
        car.location,
        car.year
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }

  const featuredCars = filtered.map((car) => ({ ...car, featured: isFeaturedCar(car) }));

  switch (sortValue) {
    case 'price-asc':
      return [...featuredCars].sort((a, b) => Number(a.price_per_day || 0) - Number(b.price_per_day || 0));
    case 'price-desc':
      return [...featuredCars].sort((a, b) => Number(b.price_per_day || 0) - Number(a.price_per_day || 0));
    case 'year-desc':
      return [...featuredCars].sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
    case 'name-asc':
      return [...featuredCars].sort((a, b) => getCarDisplayName(a).localeCompare(getCarDisplayName(b)));
    case 'featured':
    default:
      return [...featuredCars].sort((a, b) => {
        if (a.featured === b.featured) {
          return Number(a.price_per_day || 0) - Number(b.price_per_day || 0);
        }
        return a.featured ? -1 : 1;
      });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCars();
  
  const filterCategory = document.getElementById('filter-category');
  if (filterCategory) {
    filterCategory.addEventListener('change', loadCars);
  }

  const searchInput = document.getElementById('car-search');
  if (searchInput) {
    searchInput.addEventListener('input', loadCars);
  }

  const sortSelect = document.getElementById('sort-cars');
  if (sortSelect) {
    sortSelect.addEventListener('change', loadCars);
  }
  
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) bookingForm.addEventListener('submit', handleBooking);
  
  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  if (startDate) startDate.addEventListener('change', calculatePrice);
  if (endDate) endDate.addEventListener('change', calculatePrice);
});

function getFallbackCars(category = '', search = '', sortValue = 'featured') {
  return getVisibleCars(DEMO_CARS, category, search, sortValue);
}

async function loadCars() {
  const grid = document.getElementById('cars-grid');
  if (grid) {
    grid.innerHTML = '<div class="col-12"><p class="text-secondary">Loading cars...</p></div>';
  }

  const category = document.getElementById('filter-category')?.value || '';
  const search = document.getElementById('car-search')?.value || '';
  const sortValue = document.getElementById('sort-cars')?.value || 'featured';
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  try {
    const res = await fetch(`${API}/cars_api.php?${params.toString()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });

    const text = await res.text();
    const trimmed = text.trim();

    if (!res.ok || trimmed === '') {
      throw new Error(`API Error: ${res.status}`);
    }

    let cars = [];
    try {
      cars = JSON.parse(trimmed);
    } catch (parseErr) {
      console.warn('Using fallback car inventory because the backend did not return valid JSON:', trimmed.slice(0, 200));
      displayCars(getFallbackCars(category, search, sortValue));
      return;
    }

    displayCars(getVisibleCars(Array.isArray(cars) ? cars : [], category, search, sortValue));
  } catch (err) {
    console.error('Unable to load cars:', err);
    displayCars(getFallbackCars(category, search, sortValue));
  }
}

function displayCars(cars) {
  const grid = document.getElementById('cars-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  if (cars.length === 0) {
    grid.innerHTML = '<div class="col-12"><p class="text-secondary">No cars found matching your filters.</p></div>';
    return;
  }
  
  cars.forEach(car => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card bg-secondary border-secondary h-100 overflow-hidden">
        <div class="position-relative">
          <img src="${car.image_url || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80'}" class="card-img-top car-list-image" alt="${car.make} ${car.model}">
          ${car.featured ? '<span class="position-absolute top-0 start-0 badge bg-warning text-dark m-3">Featured</span>' : '<span class="position-absolute top-0 start-0 badge bg-dark text-light m-3">Available</span>'}
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <h5 class="card-title mb-0">${car.make} ${car.model}</h5>
            <span class="badge bg-info text-dark">${car.year || 'New'}</span>
          </div>
          <p class="card-text text-secondary mb-2">
            <small>${car.category || 'Featured'} • ${car.location || 'Nairobi'}</small>
          </p>
          <p class="card-text mb-3">
            <strong class="text-warning fs-5">$${parseFloat(car.price_per_day || 0).toFixed(2)}</strong>
            <span class="text-secondary">/day</span>
          </p>
          <button class="btn btn-warning text-dark btn-sm fw-semibold w-100" onclick="openBooking(${car.id}, ${car.price_per_day})">
            Book Now
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openBooking(carId, price) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    alert('Please login first');
    window.location.href = 'auth/login.html';
    return;
  }
  
  selectedCar = { id: carId, price };
  document.getElementById('booking-car-id').value = carId;
  const modal = new bootstrap.Modal(document.getElementById('bookingModal'));
  modal.show();
}

function calculatePrice() {
  if (!selectedCar) return;
  
  const start = new Date(document.getElementById('start-date').value);
  const end = new Date(document.getElementById('end-date').value);
  
  if (start && end && end > start) {
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const total = days * selectedCar.price;
    document.getElementById('total-price').textContent = `$${total.toFixed(2)}`;
  }
}

async function handleBooking(e) {
  e.preventDefault();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const carId = document.getElementById('booking-car-id').value;
  const pickupLocation = document.getElementById('pickup-location')?.value || '';
  const needsDriver = document.getElementById('need-driver')?.checked ? 1 : 0;
  
  try {
    const res = await fetch(`${API}/bookings.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        car_id: carId,
        start_date: startDate,
        end_date: endDate,
        pickup_location: pickupLocation,
        needs_driver: needsDriver,
        price_per_day: selectedCar?.price || 0
      })
    });
    
    if (!res.ok) throw new Error(`Booking failed: ${res.status}`);
    const data = await res.json();
    if (!data) throw new Error('Empty response from server');

    alert('Booking created! Total: $' + Number(data.total_price || 0).toFixed(2));
    const modal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
    if (modal) modal.hide();
    loadCars();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}
