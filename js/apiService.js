/**
 * API Service - Centralized HTTP Request Handler
 * Handles all API requests with authentication, error handling, and retries
 */
const ApiService = {
  // Configuration
  config: {
    baseURL: API_CONFIG.BASE_URL,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  },

  /**
   * Get authentication token from storage
   * Checks both localStorage and sessionStorage
   */
  getAuthToken() {
    return localStorage.getItem('auth_token') || 
           sessionStorage.getItem('auth_token') ||
           localStorage.getItem('authToken'); // Legacy support
  },

  /**
   * Set authentication token
   */
  setAuthToken(token, remember = false) {
    if (remember) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  },

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('authToken'); // Legacy
    localStorage.removeItem('user_data');
  },

  /**
   * Generic request handler with timeout and retry logic
   */
  async request(endpoint, options = {}, retryCount = 0) {
    const token = this.getAuthToken();
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Add auth token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Build request config
    const config = {
      method: options.method || 'GET',
      headers,
      ...options
    };
    
    // Add body if present and method allows it
    if (options.body && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    config.signal = controller.signal;

    try {
      console.log(`🔄 ${config.method} ${endpoint}`);
      
      const response = await fetch(`${this.config.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId);
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      // Check for errors
      if (!response.ok) {
        const errorMessage = typeof data === 'object' 
          ? (data.message || data.error || `HTTP error! status: ${response.status}`)
          : `HTTP error! status: ${response.status}`;
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      console.log(`✅ ${config.method} ${endpoint} - Success`);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (error.name === 'AbortError') {
        console.error(`⏱️ Request timeout: ${endpoint}`);
        error.message = 'Request timeout. Please try again.';
      }
      
      // Retry logic for network errors (but not auth errors)
      if (retryCount < this.config.retryAttempts && 
          !error.message.includes('401') && 
          !error.message.includes('403')) {
        console.warn(`🔄 Retrying ${endpoint} (attempt ${retryCount + 1}/${this.config.retryAttempts})`);
        await this.delay(this.config.retryDelay * (retryCount + 1));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      console.error(`❌ ${config.method} ${endpoint} - Failed:`, error.message);
      this.handleError(error, endpoint);
      throw error;
    }
  },

  /**
   * HTTP GET request
   */
  async get(endpoint, params = null) {
    let url = endpoint;
    
    // Add query parameters if provided
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      url = `${endpoint}?${queryString}`;
    }
    
    return this.request(url, { method: 'GET' });
  },

  /**
   * HTTP POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body
    });
  },

  /**
   * HTTP PUT request
   */
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body
    });
  },

  /**
   * HTTP PATCH request
   */
  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body
    });
  },

  /**
   * HTTP DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  /**
   * Upload file(s)
   */
  async upload(endpoint, formData) {
    const token = this.getAuthToken();
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary
    
    try {
      console.log(`📤 Uploading to ${endpoint}`);
      
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      console.log(`✅ Upload successful`);
      return data;
      
    } catch (error) {
      console.error(`❌ Upload failed:`, error);
      this.handleError(error, endpoint);
      throw error;
    }
  },

  /**
   * Download file
   */
  async download(endpoint, filename) {
    try {
      const token = this.getAuthToken();
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${this.config.baseURL}${endpoint}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`✅ Downloaded: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Download failed:`, error);
      this.handleError(error, endpoint);
      throw error;
    }
  },

  /**
   * Batch requests (run in parallel)
   */
  async batch(requests) {
    try {
      console.log(`🔄 Running ${requests.length} batch requests...`);
      const results = await Promise.allSettled(
        requests.map(req => this.request(req.endpoint, req.options))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ Batch complete: ${successful}/${requests.length} successful`);
      
      return results;
    } catch (error) {
      console.error('❌ Batch request failed:', error);
      throw error;
    }
  },

  /**
   * Error handler
   */
  handleError(error, endpoint = '') {
    const status = error.status || 0;
    
    // Handle specific error codes
    switch (status) {
      case 401:
        console.warn('⚠️ Unauthorized - Redirecting to login');
        this.clearAuthToken();
        if (window.location.pathname !== '/pages/auth/login.html' && 
            window.location.pathname !== '/login.html') {
          window.location.href = '/pages/auth/login.html';
        }
        break;
        
      case 403:
        console.warn('⚠️ Forbidden - Access denied');
        this.showNotification('Access denied. You do not have permission.', 'error');
        break;
        
      case 404:
        console.warn(`⚠️ Not found: ${endpoint}`);
        this.showNotification('Resource not found.', 'error');
        break;
        
      case 422:
        console.warn('⚠️ Validation error');
        this.showNotification(error.message || 'Validation error. Please check your input.', 'error');
        break;
        
      case 500:
        console.error('❌ Server error');
        this.showNotification('Server error. Please try again later.', 'error');
        break;
        
      default:
        if (error.message.includes('timeout')) {
          this.showNotification('Request timeout. Please check your connection.', 'error');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          this.showNotification('Network error. Please check your internet connection.', 'error');
        } else {
          this.showNotification(error.message || 'An error occurred. Please try again.', 'error');
        }
    }
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Try to use global notification function if available
    if (typeof showNotification === 'function') {
      showNotification(message, type);
      return;
    }
    
    // Fallback to custom notification
    const existingNotification = document.querySelector('.api-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `api-notification notification-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' :
                 'info-circle';
    
    notification.innerHTML = `
      <i class="fas fa-${icon} me-2"></i>
      <span>${message}</span>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#28a745' : 
                    type === 'error' ? '#dc3545' : 
                    type === 'warning' ? '#ffc107' :
                    '#17a2b8'};
      color: ${type === 'warning' ? '#000' : '#fff'};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
      display: flex;
      align-items: center;
      max-width: 400px;
      font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  /**
   * Utility: Delay function for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  },

  /**
   * Get current user data
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
};

// Add CSS animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}

// Log initialization
console.log(' API Service initialized');
console.log(' Base URL:', API_CONFIG.BASE_URL);