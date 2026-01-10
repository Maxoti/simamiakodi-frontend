// ============================================
// AUTHENTICATION LOGIC (auth.js) - COMPLETE
// ============================================

// -------------------- CONFIGURATION --------------------
const AUTH_API_URL = `${API_CONFIG.BASE_URL}/api/auth`;
const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const REMEMBER_ME_KEY = 'remember_me';

// -------------------- REGISTRATION --------------------

function setupRegisterForm() {
  const registerForm = document.getElementById('register-form');
  
  if (!registerForm) return;
  
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('Registration form submitted!');
    
    // Get form data - MATCH register.html field names
    const fullName = registerForm.querySelector('[name="full_name"]')?.value.trim() || '';
    const username = registerForm.querySelector('[name="username"]')?.value.trim() || '';
    const email = registerForm.querySelector('[name="email"]')?.value.trim() || '';
    const phone = registerForm.querySelector('[name="phone"]')?.value.trim() || '';
    const password = registerForm.querySelector('[name="password"]')?.value || '';
    const confirmPassword = registerForm.querySelector('[name="confirm_password"]')?.value || '';
    const role = registerForm.querySelector('[name="role"]')?.value || 'landlord';
    const termsAccepted = registerForm.querySelector('[name="terms"]')?.checked || false;
    
    console.log('Form data collected:', { username, email, fullName, role });
    
    // Validate terms
    if (!termsAccepted) {
      showNotification('Please accept the Terms of Service and Privacy Policy', 'error');
      return;
    }
    
    // Validate form
    if (!validateRegisterForm({ username, email, fullName, password, confirmPassword })) {
      return;
    }
    
    // Perform registration
    await performRegistration({ 
      username, 
      email, 
      full_name: fullName,
      phone, 
      password, 
      role 
    });
  });
}
function validateRegisterForm(data) {
  const validations = [
    validateUsername(data.username),
    validateEmail(data.email),
    validateFullName(data.fullName),
    validatePassword(data.password),
    validatePasswordMatch(data.password, data.confirmPassword)
  ];

  // Return false if any validation fails
  return validations.every(result => result === true);
}

/**
 * Validates username - accepts alphanumeric, underscores, or email format
 */
function validateUsername(username) {
  if (!username || username.length < 3) {
    showNotification('Username must be at least 3 characters', 'error');
    return false;
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
  const isAlphanumeric = /^[a-zA-Z0-9_]+$/.test(username);

  if (!isEmail && !isAlphanumeric) {
    showNotification('Username can only contain letters, numbers, underscores, or be an email', 'error');
    return false;
  }

  return true;
}

/**
 * Validates email address format
 */
function validateEmail(email) {
  if (!email) {
    showNotification('Email address is required', 'error');
    return false;
  }

  if (!isValidEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return false;
  }

  return true;
}

/**
 * Validates full name
 */
function validateFullName(fullName) {
  if (!fullName || fullName.trim().length < 2) {
    showNotification('Full name must be at least 2 characters', 'error');
    return false;
  }

  if (fullName.trim().length > 255) {
    showNotification('Full name is too long (maximum 255 characters)', 'error');
    return false;
  }

  return true;
}

/**
 * Validates password strength
 */
function validatePassword(password) {
  if (!password) {
    showNotification('Password is required', 'error');
    return false;
  }

  if (password.length < 8) {
    showNotification('Password must be at least 8 characters', 'error');
    return false;
  }

  if (password.length > 128) {
    showNotification('Password is too long (maximum 128 characters)', 'error');
    return false;
  }

  if (!isStrongPassword(password)) {
    showNotification('Password must contain at least one uppercase letter, one lowercase letter, and one number', 'error');
    return false;
  }

  return true;
}

/**
 * Validates password confirmation matches
 */
function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) {
    showNotification('Please confirm your password', 'error');
    return false;
  }

  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return false;
  }

  return true;
}

/**
 * Helper: Validates email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Checks password strength
 */
function isStrongPassword(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers;
}
async function performRegistration(userData) {
  showLoading();
  
  try {
    console.log('Sending registration request...');
    
    const response = await fetch(`${AUTH_API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Registration failed');
    }
    
    showNotification('Registration successful! Redirecting to login...', 'success');
    
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    
  } catch (error) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.message.includes('username')) {
      errorMessage = 'Username already exists. Please choose another.';
    } else if (error.message.includes('email')) {
      errorMessage = 'Email already registered. Please login instead.';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Make sure the backend is running.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    hideLoading();
  }
}

// -------------------- LOGIN --------------------

function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = loginForm.querySelector('[name="username"]').value.trim();
    const password = loginForm.querySelector('[name="password"]').value;
    const remember = loginForm.querySelector('[name="remember"]')?.checked || false;
    
    if (!username || !password) {
      showNotification('Please enter username and password', 'error');
      return;
    }
    
    await performLogin({ username, password, remember });
  });
}
async function performLogin(credentials) {
  showLoading();
  
  try {
    const response = await fetch(`${AUTH_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      })
    });
    
    // Check if response is ok first
    if (!response.ok) {
      let errorMessage = 'Login failed';
      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    saveAuthData(data.token, data.user, credentials.remember);
    
    showNotification('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = '../../dashboard.html';
    }, 1000);
    
  } catch (error) {
    console.error('Login error:', error);
    showNotification(error.message || 'Login failed. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// -------------------- UTILITY FUNCTIONS --------------------

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isStrongPassword(password) {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasNumbers;
}

function saveAuthData(token, user, remember = false) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
  
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

function getAuthToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = sessionStorage.getItem(TOKEN_KEY);
  }
  return token;
}

function isAuthenticated() {
  return !!getAuthToken();
}

// NEW FUNCTION - Protect pages that require authentication
function protectPage() {
  const token = getAuthToken();
  
  if (!token) {
    console.log('No auth token found, redirecting to login...');
    window.location.href = '/pages/auth/login.html';
    return false;
  }
  
  return true;
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = '../../dashboard.html';
  }
}

function clearFormErrors(form) {
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(msg => msg.remove());
  
  const errorInputs = form.querySelectorAll('.input-error');
  errorInputs.forEach(input => input.classList.remove('input-error'));
}

// -------------------- UI HELPERS --------------------

function showLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
  
  const buttons = document.querySelectorAll('button[type="submit"]');
  buttons.forEach(btn => {
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.setAttribute('data-original-text', originalText);
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  });
}

function hideLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
  
  const buttons = document.querySelectorAll('button[type="submit"]');
  buttons.forEach(btn => {
    btn.disabled = false;
    const originalText = btn.getAttribute('data-original-text');
    if (originalText) {
      btn.innerHTML = originalText;
    }
  });
}

function showNotification(message, type = 'info') {
  const existingNotif = document.querySelector('.notification');
  if (existingNotif) {
    existingNotif.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <div>
      <strong>${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</strong>
      <p class="mb-0">${message}</p>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function setupPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const inputGroup = this.closest('.input-group');
      if (!inputGroup) return;
      
      const input = inputGroup.querySelector('input[type="password"], input[type="text"]');
      const icon = this;
      
      if (!input) return;
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });
}

// -------------------- INITIALIZATION --------------------

function initAuth() {
  console.log('Initializing auth...');
  
  setupLoginForm();
  setupRegisterForm();
  setupPasswordToggles();
  
  // Only redirect from login page, NOT register page
  if (window.location.pathname.includes('login.html')) {
    redirectIfAuthenticated();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}