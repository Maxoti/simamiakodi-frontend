// API Service - Handles all HTTP requests
const ApiService = {
  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('authToken');
  },

  // Generic request handler
  async request(endpoint, options = {}) {
    const token = this.getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      this.handleError(error);
      throw error;
    }
  },

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  // Error handler
  handleError(error) {
    // Check for authentication errors
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      localStorage.removeItem('authToken');
      window.location.href = '/login.html';
    }
    
    // Show error notification (you can customize this)
    if (typeof showNotification === 'function') {
      showNotification(error.message, 'error');
    } else {
      alert(`Error: ${error.message}`);
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}