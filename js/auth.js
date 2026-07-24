function getProjectBasePath() {
  const pathname = window.location.pathname || '/';
  const cleaned = pathname.replace(/\/(index\.html|cars\.html|dashboard\.html|review\.html|auth\/login\.html|auth\/register\.html)$/, '');
  return cleaned === '/' ? '' : cleaned;
}

function getApiBase() {
  const basePath = getProjectBasePath();
  // If the page is served via http(s), use origin + basePath; otherwise use relative path.
  if (window.location.protocol.startsWith('http')) {
    return `${window.location.origin}${basePath}/backend`;
  }
  return `${basePath}/backend`;
}

function goTo(path) {
  const basePath = getProjectBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const targetPath = `${window.location.origin}${basePath}${normalizedPath}`;
  window.location.replace(targetPath);
}

function getErrorElement() {
  return document.getElementById('error-msg') || document.getElementById('error-message');
}

async function checkBackendReachable() {
  const apiPing = `${getApiBase()}/auth.php`;
  try {
    const res = await fetch(apiPing, { method: 'OPTIONS' });
    if (res && (res.ok || res.status === 0)) {
      return true;
    }
    showError(`Backend reachable but responded ${res.status}`);
    return false;
  } catch (err) {
    const msg = 'Backend unreachable. Run a local PHP server from the project root, e.g. `php -S 127.0.0.1:80 -t .` and open http://127.0.0.1/auth/login.html';
    showError(msg);
    return false;
  }
}

function showError(msg) {
  const errorDiv = getErrorElement();
  if (errorDiv) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('d-none');
    errorDiv.style.display = 'block';
    setTimeout(() => {
      errorDiv.classList.add('d-none');
      errorDiv.style.display = 'none';
    }, 5000);
  } else {
    alert('Error: ' + msg);
  }
}

function clearError() {
  const errorDiv = getErrorElement();
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('d-none');
    errorDiv.style.display = 'none';
  }
}

function setupRoleToggle() {
  const roleSelect = document.getElementById('role');
  const cvGroup = document.getElementById('driver-cv-group');
  const cvInput = document.getElementById('driver-cv');

  if (!roleSelect || !cvGroup || !cvInput) {
    return;
  }

  const toggleCvGroup = () => {
    const showCv = roleSelect.value === '2';
    cvGroup.classList.toggle('d-none', !showCv);
    cvInput.required = showCv;
  };

  roleSelect.addEventListener('change', toggleCvGroup);
  toggleCvGroup();
}

async function loginHandler(e) {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    const res = await fetch(`${getApiBase()}/auth.php?action=login`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Login failed: ${res.status}`;
      try {
        const payload = JSON.parse(text);
        errorMessage = payload.error ? `Login failed: ${payload.error}` : errorMessage;
      } catch {
        if (text) errorMessage = `${errorMessage} - ${text}`;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    if (!data) throw new Error('Empty response from server');

    if (data.error) {
      showError(data.error);
      return;
    }

    localStorage.setItem('user', JSON.stringify(data));
    goTo('/dashboard.html');
  } catch (err) {
    showError(err.message);
  }
}

async function registerHandler(e) {
  e.preventDefault();
  clearError();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;
  const role = document.getElementById('role').value;

  if (password !== password2) {
    showError('Passwords do not match');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('action', 'register');
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('role_id', role);

    if (role === '2') {
      const cvInput = document.getElementById('driver-cv');
      if (cvInput && cvInput.files && cvInput.files[0]) {
        formData.append('driver_cv', cvInput.files[0]);
      }
    }

    const res = await fetch(`${getApiBase()}/auth.php?action=register`, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Registration failed: ${res.status}`;
      try {
        const payload = JSON.parse(text);
        errorMessage = payload.error ? `Registration failed: ${payload.error}` : errorMessage;
      } catch {
        if (text) errorMessage = `${errorMessage} - ${text}`;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    if (!data) throw new Error('Empty response from server');

    if (data.error) {
      showError(data.error);
      return;
    }

    alert('Registration successful! Please login.');
    setTimeout(() => goTo('/auth/login.html'), 50);
  } catch (err) {
    showError(err.message);
  }
}

function logout() {
  localStorage.removeItem('user');
  goTo('/index.html');
}

function updateNavBar(user) {
  const navAuth = document.getElementById('nav-auth');
  const navRegister = document.getElementById('nav-register');
  const navUserMenu = document.getElementById('nav-user-menu');

  if (navAuth) navAuth.style.display = 'none';
  if (navRegister) navRegister.style.display = 'none';
  if (navUserMenu) {
    navUserMenu.style.display = 'block';
    const userName = document.getElementById('user-name');
    if (userName) {
      userName.textContent = user.name || user.email;
    }
  }
}

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.id) {
    updateNavBar(user);
  }
  // If backend is not reachable (e.g. opening files via file://), show a helpful message
  checkBackendReachable().then((ok) => {
    if (!ok) {
      const loginForm = document.getElementById('login-form');
      const registerForm = document.getElementById('register-form');
      if (loginForm) {
        const btn = loginForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
      }
      if (registerForm) {
        const btn = registerForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
      }
    }
  });

  if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', loginHandler);
  }

  if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', registerHandler);
    setupRoleToggle();
  }
});
