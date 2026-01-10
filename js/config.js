/**
 * SimamiaKodi API Configuration
 * Auto-detects environment and provides centralized API endpoints
 */

// Environment Configuration
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:5000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    DEBUG: true
  },
  staging: {
    BASE_URL: 'https://simamiakodi-staging.onrender.com',  // If you have staging
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    DEBUG: true
  },
  production: {
    BASE_URL: 'https://simamiakodi-backend.onrender.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 2,
    DEBUG: false
  }
};

/**
 * Auto-detect environment based on hostname
 */
function getEnvironment() {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  // Staging (if you use a staging subdomain)
  if (hostname.includes('staging')) {
    return 'staging';
  }
  
  // Production (Vercel, custom domain, etc.)
  return 'production';
}

/**
 * Get current environment
 * Can be overridden with localStorage for testing
 */
function getCurrentEnvironment() {
  // Allow manual override for testing
  const override = localStorage.getItem('ENV_OVERRIDE');
  if (override && ENV_CONFIG[override]) {
    console.warn(`⚠️ Environment overridden to: ${override}`);
    return override;
  }
  
  return getEnvironment();
}

// Current environment
const CURRENT_ENV = getCurrentEnvironment();
const ENV_SETTINGS = ENV_CONFIG[CURRENT_ENV];

/**
 * Main API Configuration Object
 */
const API_CONFIG = {
  // Base URL
  BASE_URL: ENV_SETTINGS.BASE_URL,
  
  // Environment info
  ENVIRONMENT: CURRENT_ENV,
  IS_DEVELOPMENT: CURRENT_ENV === 'development',
  IS_STAGING: CURRENT_ENV === 'staging',
  IS_PRODUCTION: CURRENT_ENV === 'production',
  
  // Request settings
  TIMEOUT: ENV_SETTINGS.TIMEOUT,
  RETRY_ATTEMPTS: ENV_SETTINGS.RETRY_ATTEMPTS,
  DEBUG: ENV_SETTINGS.DEBUG,
  
  /**
   * API Endpoints
   */
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY: '/api/auth/verify',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password'
    },
    
    // Tenants
    TENANTS: '/api/tenants',
    TENANT_BY_ID: (id) => `/api/tenants/${id}`,
    TENANT_PAYMENTS: (id) => `/api/tenants/${id}/payments`,
    TENANT_BALANCE: (id) => `/api/tenants/${id}/balance`,
    
    // Payments
    PAYMENTS: '/api/payments',
    PAYMENT_BY_ID: (id) => `/api/payments/${id}`,
    PAYMENT_RECEIPT: (id) => `/api/payments/${id}/receipt`,
    
    // Properties
    PROPERTIES: '/api/properties',
    PROPERTY_BY_ID: (id) => `/api/properties/${id}`,
    PROPERTY_UNITS: (id) => `/api/properties/${id}/units`,
    PROPERTY_STATS: (id) => `/api/properties/${id}/stats`,
    
    // Units
    UNITS: '/api/units',
    UNIT_BY_ID: (id) => `/api/units/${id}`,
    UNIT_TENANTS: (id) => `/api/units/${id}/tenants`,
    UNIT_HISTORY: (id) => `/api/units/${id}/history`,
    
    // Expenses
    EXPENSES: '/api/expenses',
    EXPENSE_BY_ID: (id) => `/api/expenses/${id}`,
    EXPENSE_CATEGORIES: '/api/expenses/categories',
    
    // Maintenance
    MAINTENANCE: '/api/maintenance',
    MAINTENANCE_BY_ID: (id) => `/api/maintenance/${id}`,
    MAINTENANCE_STATS: '/api/maintenance/stats',
    
    // Utilities
    UTILITIES: '/api/utilities',
    UTILITY_BY_ID: (id) => `/api/utilities/${id}`,
    UTILITY_STATS: '/api/utilities/stats',
    
    // Agents
    AGENTS: '/api/agents',
    AGENT_BY_ID: (id) => `/api/agents/${id}`,
    AGENT_PROPERTIES: (id) => `/api/agents/${id}/properties`,
    
    // Caretakers
    CARETAKERS: '/api/caretakers',
    CARETAKER_BY_ID: (id) => `/api/caretakers/${id}`,
    CARETAKER_PROPERTIES: (id) => `/api/caretakers/${id}/properties`,
    
    // Payment Plans
    PAYMENT_PLANS: '/api/paymentplans',
    PAYMENT_PLAN_BY_ID: (id) => `/api/paymentplans/${id}`,
    
    // Users
    USERS: '/api/users',
    USER_BY_ID: (id) => `/api/users/${id}`,
    USER_PROFILE: '/api/users/profile',
    USER_UPDATE_PASSWORD: '/api/users/update-password',
    
    // Reports
    REPORTS: {
      DASHBOARD: '/api/reports/dashboard',
      FINANCIAL: '/api/reports/financial',
      OCCUPANCY: '/api/reports/occupancy',
      MAINTENANCE: '/api/reports/maintenance',
      TENANT: '/api/reports/tenant',
      CUSTOM: '/api/reports/custom'
    },
    
    // WhatsApp
    WHATSAPP: {
      STATUS: '/api/whatsapp/status',
      SEND: '/api/whatsapp/send-message',
      SEND_BULK: '/api/whatsapp/send-bulk',
      RENT_REMINDER: '/api/whatsapp/send-rent-reminder',
      ALL_REMINDERS: '/api/whatsapp/send-all-reminders',
      PAYMENT_CONFIRMATION: '/api/whatsapp/send-payment-confirmation'
    },
    
    // Dashboard
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      RECENT_PAYMENTS: '/api/dashboard/recent-payments',
      PENDING_TASKS: '/api/dashboard/pending-tasks',
      OCCUPANCY: '/api/dashboard/occupancy',
      REVENUE: '/api/dashboard/revenue'
    },
    
    // File Upload
    UPLOAD: {
      IMAGE: '/api/upload/image',
      DOCUMENT: '/api/upload/document',
      BULK: '/api/upload/bulk'
    }
  },
  
  /**
   * Helper method to build full URL
   */
  buildURL(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  },
  
  /**
   * Helper method to get endpoint with params
   */
  getEndpoint(path, params = {}) {
    let endpoint = path;
    
    // Replace path parameters
    Object.keys(params).forEach(key => {
      endpoint = endpoint.replace(`:${key}`, params[key]);
    });
    
    return endpoint;
  }
};

/**
 * Utility Functions
 */
const ConfigUtils = {
  /**
   * Override environment (for testing)
   */
  setEnvironment(env) {
    if (ENV_CONFIG[env]) {
      localStorage.setItem('ENV_OVERRIDE', env);
      console.log(`✅ Environment set to: ${env}`);
      console.log('🔄 Please refresh the page for changes to take effect');
      return true;
    }
    console.error(`❌ Invalid environment: ${env}`);
    return false;
  },
  
  /**
   * Clear environment override
   */
  clearEnvironmentOverride() {
    localStorage.removeItem('ENV_OVERRIDE');
    console.log('✅ Environment override cleared');
    console.log('🔄 Please refresh the page for changes to take effect');
  },
  
  /**
   * Get current configuration
   */
  getConfig() {
    return {
      environment: API_CONFIG.ENVIRONMENT,
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
      debug: API_CONFIG.DEBUG
    };
  },
  
  /**
   * Print configuration (for debugging)
   */
  printConfig() {
    console.log('═══════════════════════════════════════');
    console.log(' SimamiaKodi API Configuration');
    console.log('═══════════════════════════════════════');
    console.log('Environment:', API_CONFIG.ENVIRONMENT);
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Timeout:', API_CONFIG.TIMEOUT + 'ms');
    console.log('Retry Attempts:', API_CONFIG.RETRY_ATTEMPTS);
    console.log('Debug Mode:', API_CONFIG.DEBUG);
    console.log('═══════════════════════════════════════');
  },
  
  /**
   * Test connection to backend
   */
  async testConnection() {
    try {
      console.log('🔍 Testing connection to:', API_CONFIG.BASE_URL);
      const response = await fetch(API_CONFIG.BASE_URL + '/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection successful:', data);
        return true;
      } else {
        console.warn('⚠️ Connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }
  }
};

// Log configuration on load
if (API_CONFIG.DEBUG) {
  ConfigUtils.printConfig();
  
  // Auto-test connection in development
  if (API_CONFIG.IS_DEVELOPMENT) {
    setTimeout(() => ConfigUtils.testConnection(), 1000);
  }
}

// Make utilities available globally
window.ConfigUtils = ConfigUtils;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, ConfigUtils };
}

// Make it globally available
window.API_CONFIG = API_CONFIG;

// Development helpers
if (API_CONFIG.IS_DEVELOPMENT) {
  console.log('💡 Development Mode Active');
  console.log('💡 Available commands:');
  console.log('   ConfigUtils.printConfig() - Show current config');
  console.log('   ConfigUtils.testConnection() - Test API connection');
  console.log('   ConfigUtils.setEnvironment("production") - Override environment');
  console.log('   ConfigUtils.clearEnvironmentOverride() - Clear override');
}