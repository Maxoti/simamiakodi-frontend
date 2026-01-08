// API Configuration - Auto-detects environment
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:5000'
  },
  production: {
    BASE_URL: 'https://simamiakodi-backend.onrender.com'  // Your Render backend URL
  }
};

// Auto-detect environment
function getEnvironment() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Production (Vercel, custom domain, etc.)
  return 'production';
}

// Get current environment
const CURRENT_ENV = getEnvironment();

// API Configuration
const API_CONFIG = {
  BASE_URL: ENV_CONFIG[CURRENT_ENV].BASE_URL,
  ENVIRONMENT: CURRENT_ENV,
  
  ENDPOINTS: {
    // Tenants
    TENANTS: '/api/tenants',
    TENANT_BY_ID: (id) => `/api/tenants/${id}`,
    
    // Payments
    PAYMENTS: '/api/payments',
    PAYMENT_BY_ID: (id) => `/api/payments/${id}`,
    
    // Properties
    PROPERTIES: '/api/properties',
    PROPERTY_BY_ID: (id) => `/api/properties/${id}`,
    
    // Expenses
    EXPENSES: '/api/expenses',
    EXPENSE_BY_ID: (id) => `/api/expenses/${id}`,
    
    // Reports
    REPORTS: '/api/reports',
    
    // Agents
    AGENTS: '/api/agents',
    AGENT_BY_ID: (id) => `/api/agents/${id}`,
    
    // Caretakers
    CARETAKERS: '/api/caretakers',
    CARETAKER_BY_ID: (id) => `/api/caretakers/${id}`,
    
    // Maintenance
    MAINTENANCE: '/api/maintenance',
    MAINTENANCE_BY_ID: (id) => `/api/maintenance/${id}`,
    
    // Payment Plans
    PAYMENT_PLANS: '/api/paymentplans',
    PAYMENT_PLAN_BY_ID: (id) => `/api/paymentplans/${id}`,
    
    // Units
    UNITS: '/api/units',
    UNIT_BY_ID: (id) => `/api/units/${id}`,
    
    // Users
    USERS: '/api/users',
    USER_BY_ID: (id) => `/api/users/${id}`,
    
    // Utilities
    UTILITIES: '/api/utilities',
    UTILITY_BY_ID: (id) => `/api/utilities/${id}`,
    
    // WhatsApp
    WHATSAPP: '/api/whatsapp',
    WHATSAPP_SEND: '/api/whatsapp/send',
    
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh'
    }
  }
};

// Log configuration (helps with debugging)
console.log(' SimamiaKodi Configuration');
console.log('Environment:', CURRENT_ENV);
console.log('API Base URL:', API_CONFIG.BASE_URL);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API_CONFIG;
}

// Also make it globally available
window.API_CONFIG = API_CONFIG;