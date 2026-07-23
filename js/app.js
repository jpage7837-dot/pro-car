// `API` is provided by js/api.js which sets `window.API` dynamically

const DEMO_CARS = [
  { id: 1, make: 'Toyota', model: 'Corolla', year: 2022, category: 'Sedan', price_per_day: 55, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80' },
  { id: 2, make: 'Honda', model: 'Civic', year: 2021, category: 'Sedan', price_per_day: 60, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=80' },
  { id: 3, make: 'BMW', model: 'X5', year: 2023, category: 'SUV', price_per_day: 120, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80' },
  { id: 4, make: 'Mercedes', model: 'C Class', year: 2020, category: 'Luxury', price_per_day: 95, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { id: 5, make: 'Ford', model: 'Ranger', year: 2024, category: 'Pickup', price_per_day: 85, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=900&q=80' },
  { id: 6, make: 'Nissan', model: 'Altima', year: 2019, category: 'Sedan', price_per_day: 50, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80' },
  { id: 7, make: 'Tesla', model: 'Model 3', year: 2023, category: 'Electric', price_per_day: 125, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=900&q=80' },
  { id: 8, make: 'Toyota', model: 'Camry', year: 2024, category: 'Sedan', price_per_day: 71, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80' },
  { id: 9, make: 'Jeep', model: 'Wrangler', year: 2023, category: 'SUV', price_per_day: 110, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=900&q=80' },
  { id: 10, make: 'Mini', model: 'Cooper', year: 2023, category: 'Convertible', price_per_day: 112, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80' },
  { id: 11, make: 'Lexus', model: 'ES 300h', year: 2024, category: 'Hybrid', price_per_day: 115, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80' },
  { id: 12, make: 'Kia', model: 'Sportage', year: 2024, category: 'SUV', price_per_day: 90, available: 1, booked: 0, image_url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80' }
];

window.CUSTOMER_REVIEWS = [
  { name: 'Amina K.', rating: 5, quote: 'The booking flow was smooth and the car was spotless. I would rent again.' },
  { name: 'Daniel M.', rating: 5, quote: 'Great selection of premium cars and fast support from the team.' },
  { name: 'Lina R.', rating: 5, quote: 'Loved the home page browsing experience and the wide range of vehicles.' }
];

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) {
    updateNavBar(user);
  }

  loadHomeContent();
  setInterval(loadHomeContent, 8000);
});

async function loadHomeContent() {
  try {
    const [carsResponse, bookingsResponse] = await Promise.all([
      fetch(`${API}/cars_api.php`, { cache: 'no-store' }).then(res => res.json()),
      fetch(`${API}/bookings.php?admin=1`, { cache: 'no-store' }).then(res => res.json())
    ]);

    const cars = Array.isArray(carsResponse)
      ? carsResponse.filter(car => Number(car.available ?? 1) === 1)
      : DEMO_CARS;

    const bookings = Array.isArray(bookingsResponse)
      ? bookingsResponse.filter(booking => {
          const status = String(booking.status || '').toLowerCase();
          return status !== 'cancelled' && status !== 'rejected';
        })
      : [];

    displayFeaturedCars(cars);
    renderReviews();
    renderStats(cars.length, bookings.length);
  } catch (error) {
    console.error('Unable to load home page data:', error);
    displayFeaturedCars(DEMO_CARS);
    renderReviews();
    renderStats(DEMO_CARS.length, 10);
  }
}

function shuffleCars(cars) {
  const items = [...cars];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function displayFeaturedCars(cars) {
  const grid = document.getElementById('featured-cars-grid');
  if (!grid) return;

  grid.innerHTML = '';
  if (!Array.isArray(cars) || cars.length === 0) {
    grid.innerHTML = '<div class="col-12"><p class="text-secondary">No cars available</p></div>';
    return;
  }

  shuffleCars(cars).slice(0, 6).forEach(car => {
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    card.innerHTML = `
      <div class="card bg-secondary border-secondary h-100 overflow-hidden hover-lift">
        <img src="${car.image_url || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d8?auto=format&fit=crop&w=900&q=80'}" class="card-img-top" alt="${car.make} ${car.model}" style="height: 220px; object-fit: cover;">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <p class="text-warning small mb-1">${car.category || 'Featured'}</p>
              <h5 class="card-title mb-1">${car.make} ${car.model}</h5>
            </div>
            <span class="badge bg-info">${car.year || 'New'}</span>
          </div>
          <p class="card-text text-secondary small mb-3">
            ${car.location || 'Nairobi'} • ${car.available ? 'Available now' : 'Booked'}
          </p>
          <p class="card-text mb-3">
            <strong class="text-warning fs-5">$${parseFloat(car.price_per_day || 0).toFixed(2)}</strong>
            <span class="text-secondary">/day</span>
          </p>
          <a href="cars.html" class="btn btn-warning text-dark btn-sm fw-semibold w-100">View Details</a>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderReviews() {
  const reviewsGrid = document.getElementById('reviews-grid');
  if (!reviewsGrid) return;

  reviewsGrid.innerHTML = '';
  window.CUSTOMER_REVIEWS.forEach(review => {
    const card = document.createElement('div');
    card.className = 'col-md-4';
    card.innerHTML = `
      <div class="card bg-secondary border-secondary h-100">
        <div class="card-body">
          <div class="text-warning mb-2">${'★'.repeat(review.rating)}</div>
          <p class="card-text">“${review.quote}”</p>
          <h6 class="mb-0 text-light">${review.name}</h6>
        </div>
      </div>
    `;
    reviewsGrid.appendChild(card);
  });
}

function renderStats(carsCount, bookingCount) {
  const statsDiv = document.getElementById('hero-stats');
  if (!statsDiv) return;

  statsDiv.innerHTML = `
    <div>
      <h3 class="text-warning">${carsCount}</h3>
      <p class="small">Cars Available</p>
    </div>
    <div>
      <h3 class="text-warning">1.2k+</h3>
      <p class="small">Happy Customers</p>
    </div>
    <div>
      <h3 class="text-warning">${bookingCount}</h3>
      <p class="small">Bookings</p>
    </div>
  `;
}

function updateNavBar(user) {
  const navAuth = document.getElementById('nav-auth');
  const navRegister = document.getElementById('nav-register');
  const navUserMenu = document.getElementById('nav-user-menu');
  
  if (navAuth) navAuth.style.display = 'none';
  if (navRegister) navRegister.style.display = 'none';
  if (navUserMenu) {
    navUserMenu.style.display = 'block';
    document.getElementById('user-name').textContent = user.name || user.email;
  }
}

function logout() {
  localStorage.removeItem('user');
  location.reload();
}

