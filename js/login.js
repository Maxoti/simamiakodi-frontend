const BACKEND_URL = API_BASE_URL || 'https://simamiakodi-backend.onrender.com';

console.log(' Login page loaded');
console.log(' Backend URL:', BACKEND_URL);
// ============================================
// PASSWORD TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const passwordToggle = document.querySelector('.password-toggle');
    const passwordInput = document.querySelector('input[name="password"]');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            passwordToggle.classList.toggle('fa-eye');
            passwordToggle.classList.toggle('fa-eye-slash');
        });
    }
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon} fa-lg"></i>
        <div>
            <strong>${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</strong>
            <p class="mb-0 small">${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ============================================
// LOADER FUNCTIONS
// ============================================
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// ============================================
// LOGIN HANDLER
// ============================================
async function handleLogin(event) {
    event.preventDefault();
    
    console.log(' Login form submitted');
    
    // Get form data
    const form = event.target;
    const username = form.username.value.trim();
    const password = form.password.value;
    const remember = form.remember.checked;
    
    // Validate
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }
    
    console.log(' Login attempt:', { username, remember });
    
    // Show loader
    showLoader();
    
    // Disable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Signing in...';
    
    try {
        console.log(' Calling backend:', `${BACKEND_URL}/api/auth/login`);
        
        // Call login API
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        console.log(' Response status:', response.status);
        
        // Parse response
        const data = await response.json();
        console.log(' Response data:', data);
        
        if (!response.ok) {
            // Login failed
            throw new Error(data.message || data.error || 'Login failed');
        }
        
        // Login successful
        console.log(' Login successful!');
        showNotification('Login successful! Redirecting...', 'success');
        
        // Store authentication data
        const storage = remember ? localStorage : sessionStorage;
        
        if (data.token) {
            storage.setItem('token', data.token);
        }
        
        if (data.user) {
            storage.setItem('user', JSON.stringify(data.user));
        }
        
        // Store user info for easy access
        if (data.user) {
            storage.setItem('userId', data.user.id || data.user.user_id);
            storage.setItem('username', data.user.username || data.user.name);
            storage.setItem('email', data.user.email);
            storage.setItem('role', data.user.role || 'user');
        }
        
        console.log(' User data stored');
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1000);
        
    } catch (error) {
        console.error(' Login error:', error);
        
        hideLoader();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        
        // Show error message
        let errorMessage = error.message;
        
        // Handle specific errors
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection or try again later.';
        } else if (error.message.includes('Invalid credentials')) {
            errorMessage = 'Invalid username or password. Please try again.';
        } else if (error.message.includes('User not found')) {
            errorMessage = 'User not found. Please check your username.';
        }
        
        showNotification(errorMessage, 'error');
    }
}

// ============================================
// ATTACH FORM SUBMIT HANDLER
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form handler attached');
    } else {
        console.error('❌ Login form not found!');
    }
});

// ============================================
// CHECK IF ALREADY LOGGED IN
// ============================================
window.addEventListener('load', () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
        console.log(' User already logged in, redirecting...');
        showNotification('Already logged in. Redirecting...', 'info');
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1000);
    }
});