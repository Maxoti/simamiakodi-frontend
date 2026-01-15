// ======================================================
// AUTH MODULE (auth.js) – CLEAN, SCALABLE, CONSISTENT
// ======================================================

// -------------------- CONFIG --------------------
const AUTH_API_URL = `${API_CONFIG.BASE_URL}/api/auth`;

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
  REMEMBER: 'remember_me'
};

// -------------------- INIT --------------------
function initAuth() {
  console.log('Auth initialized');

  setupLoginForm();
  setupRegisterForm();
  setupPasswordToggles();

  if (location.pathname.includes('login.html')) {
    redirectIfAuthenticated();
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', initAuth)
  : initAuth();

// ======================================================
// REGISTRATION
// ======================================================
function setupRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = collectRegisterData(form);
    if (!validateRegisterForm(data)) return;

    await registerUser(data);
  });
}

function collectRegisterData(form) {
  return {
    full_name: getValue(form, 'full_name'),
    username: getValue(form, 'username'),
    email: getValue(form, 'email'),
    phone: getValue(form, 'phone'),
    password: getValue(form, 'password', false),
    confirmPassword: getValue(form, 'confirm_password', false),
    role: getValue(form, 'role') || 'landlord',
    terms: form.querySelector('[name="terms"]')?.checked
  };
}

async function registerUser(userData) {
  showLoading();

  try {
    const res = await fetch(`${AUTH_API_URL}/register`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(userData)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    showNotification('Registration successful. Please login.', 'success');
    setTimeout(() => location.href = 'login.html', 1500);

  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ======================================================
// LOGIN
// ======================================================
function setupLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = getValue(form, 'username');
    const password = getValue(form, 'password', false);
    const remember = form.querySelector('[name="remember"]')?.checked;

    if (!username || !password) {
      showNotification('Username and password required', 'error');
      return;
    }

    await loginUser({ username, password, remember });
  });
}

async function loginUser(credentials) {
  showLoading();

  try {
    const res = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(credentials)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    saveAuth(data.token, data.user, credentials.remember);
    showNotification('Login successful', 'success');

    setTimeout(() => location.href = '../../dashboard.html', 1000);

  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    hideLoading();
  }
}

// ======================================================
// VALIDATION
// ======================================================
function validateRegisterForm(data) {
  if (!data.terms) return error('Accept terms to continue');
  if (!isValidUsername(data.username)) return false;
  if (!isValidEmail(data.email)) return false;
  if (!isValidName(data.full_name)) return false;
  if (!isStrongPassword(data.password)) return false;
  if (data.password !== data.confirmPassword)
    return error('Passwords do not match');

  return true;
}

// ======================================================
// AUTH STATE
// ======================================================
function saveAuth(token, user, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

  remember
    ? localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true')
    : localStorage.removeItem(STORAGE_KEYS.REMEMBER);
}

function getToken() {
  return (
    localStorage.getItem(STORAGE_KEYS.TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.TOKEN)
  );
}

function isAuthenticated() {
  return !!getToken();
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    location.href = '../../dashboard.html';
  }
}

function protectPage() {
  if (!isAuthenticated()) {
    location.href = '/pages/auth/login.html';
    return false;
  }
  return true;
}

// ======================================================
// HELPERS
// ======================================================
function getValue(form, name, trim = true) {
  const el = form.querySelector(`[name="${name}"]`);
  return el ? (trim ? el.value.trim() : el.value) : '';
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json' };
}

function error(msg) {
  showNotification(msg, 'error');
  return false;
}

// ======================================================
// VALIDATORS
// ======================================================
function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,}$/.test(username);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidName(name) {
  return name && name.length >= 2 && name.length <= 255;
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

// ======================================================
// UI
// ======================================================
function showLoading() {
  document.querySelectorAll('button[type="submit"]').forEach(btn => {
    btn.disabled = true;
    btn.dataset.text = btn.innerHTML;
    btn.innerHTML = 'Loading...';
  });
}

function hideLoading() {
  document.querySelectorAll('button[type="submit"]').forEach(btn => {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.text || btn.innerHTML;
  });
}

function showNotification(message, type) {
  alert(`${type.toUpperCase()}: ${message}`);
}

function setupPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.input-group')?.querySelector('input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}
