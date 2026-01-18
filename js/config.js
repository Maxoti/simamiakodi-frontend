/**
 * SimamiaKodi API Configuration
 * Auto-detects environment and provides centralized API endpoints with caching
 */

// Storage Keys Configuration
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBER_ME: 'rememberMe',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// Environment Configuration
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:5000',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    DEBUG: true,
    CACHE_TTL: 60000 // 1 minute cache in dev
  },
  staging: {
    BASE_URL: 'https://simamiakodi-staging.onrender.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    DEBUG: true,
    CACHE_TTL: 120000 // 2 minutes
  },
  production: {
    BASE_URL: 'https://simamiakodi-backend.onrender.com',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 2,
    DEBUG: false,
    CACHE_TTL: 300000 // 5 minutes in production
  }
};

/**
 * Auto-detect environment based on hostname
 */
function getEnvironment() {
  const hostname = window.location.hostname;  
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('staging')) {
    return 'staging';
  }
  
  return 'production';
}

/**
 * Get current environment with override support
 */
function getCurrentEnvironment() {
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
 * Cache Service - Lightning Fast Data Access ⚡
 */
const CacheService = {
    cache: new Map(),
    stats: { hits: 0, misses: 0 },
    
    set(key, data, ttl) {
        const expires = Date.now() + (ttl || ENV_SETTINGS.CACHE_TTL);
        this.cache.set(key, { data, expires });
        
        if (ENV_SETTINGS.DEBUG) {
            console.log(`Cached: ${key} (expires in ${ttl || ENV_SETTINGS.CACHE_TTL}ms)`);
        }
    },
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        if (ENV_SETTINGS.DEBUG) {
            console.log(`⚡ Cache hit: ${key}`);
        }
        
        return item.data;
    },
    
    delete(key) {
        this.cache.delete(key);
        if (ENV_SETTINGS.DEBUG) {
            console.log(`Cleared cache: ${key}`);
        }
    },
    
    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
        console.log(' All cache cleared');
    },
    
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
        
        return {
            ...this.stats,
            total,
            hitRate: `${hitRate}%`,
            size: this.cache.size
        };
    },
    
    printStats() {
        const stats = this.getStats();
        console.log('═══════════════════════════════════════');
        console.log(' Cache Statistics');
        console.log('═══════════════════════════════════════');
        console.log('Hits:', stats.hits);
        console.log('Misses:', stats.misses);
        console.log('Hit Rate:', stats.hitRate);
        console.log('Cache Size:', stats.size);
        console.log('═══════════════════════════════════════');
    }
};

/**
 * Main API Configuration Object
 */
const API_CONFIG = {
  BASE_URL: ENV_SETTINGS.BASE_URL,
  
  ENVIRONMENT: CURRENT_ENV,
  IS_DEVELOPMENT: CURRENT_ENV === 'development',
  IS_STAGING: CURRENT_ENV === 'staging',
  IS_PRODUCTION: CURRENT_ENV === 'production',
  
  TIMEOUT: ENV_SETTINGS.TIMEOUT,
  RETRY_ATTEMPTS: ENV_SETTINGS.RETRY_ATTEMPTS,
  DEBUG: ENV_SETTINGS.DEBUG,
  CACHE_TTL: ENV_SETTINGS.CACHE_TTL,
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      VERIFY: '/api/auth/verify',
      FORGOT_PASSWORD: '/api/auth/forgot-password',
      RESET_PASSWORD: '/api/auth/reset-password'
    },
    
    TENANTS: '/api/tenants',
    TENANT_BY_ID: (id) => `/api/tenants/${id}`,
    TENANT_PAYMENTS: (id) => `/api/tenants/${id}/payments`,
    TENANT_BALANCE: (id) => `/api/tenants/${id}/balance`,
    
    PAYMENTS: '/api/payments',
    PAYMENT_BY_ID: (id) => `/api/payments/${id}`,
    PAYMENT_RECEIPT: (id) => `/api/payments/${id}/receipt`,
    
    PROPERTIES: '/api/properties',
    PROPERTY_BY_ID: (id) => `/api/properties/${id}`,
    PROPERTY_UNITS: (id) => `/api/properties/${id}/units`,
    PROPERTY_STATS: (id) => `/api/properties/${id}/stats`,
    
    UNITS: '/api/units',
    UNIT_BY_ID: (id) => `/api/units/${id}`,
    UNIT_TENANTS: (id) => `/api/units/${id}/tenants`,
    UNIT_HISTORY: (id) => `/api/units/${id}/history`,
    
    EXPENSES: '/api/expenses',
    EXPENSE_BY_ID: (id) => `/api/expenses/${id}`,
    EXPENSE_CATEGORIES: '/api/expenses/categories',
    
    MAINTENANCE: '/api/maintenance',
    MAINTENANCE_BY_ID: (id) => `/api/maintenance/${id}`,
    MAINTENANCE_STATS: '/api/maintenance/stats',
    
    UTILITIES: '/api/utilities',
    UTILITY_BY_ID: (id) => `/api/utilities/${id}`,
    UTILITY_STATS: '/api/utilities/stats',
    
    AGENTS: '/api/agents',
    AGENT_BY_ID: (id) => `/api/agents/${id}`,
    AGENT_PROPERTIES: (id) => `/api/agents/${id}/properties`,
    
    CARETAKERS: '/api/caretakers',
    CARETAKER_BY_ID: (id) => `/api/caretakers/${id}`,
    CARETAKER_PROPERTIES: (id) => `/api/caretakers/${id}/properties`,
    
    PAYMENT_PLANS: '/api/paymentplans',
    PAYMENT_PLAN_BY_ID: (id) => `/api/paymentplans/${id}`,
    
    USERS: '/api/users',
    USER_BY_ID: (id) => `/api/users/${id}`,
    USER_PROFILE: '/api/users/profile',
    USER_UPDATE_PASSWORD: '/api/users/update-password',
    
    REPORTS: {
      DASHBOARD: '/api/reports/dashboard',
      FINANCIAL: '/api/reports/financial',
      OCCUPANCY: '/api/reports/occupancy',
      MAINTENANCE: '/api/reports/maintenance',
      TENANT: '/api/reports/tenant',
      CUSTOM: '/api/reports/custom'
    },
    
    WHATSAPP: {
      STATUS: '/api/whatsapp/status',
      SEND: '/api/whatsapp/send-message',
      SEND_BULK: '/api/whatsapp/send-bulk',
      RENT_REMINDER: '/api/whatsapp/send-rent-reminder',
      ALL_REMINDERS: '/api/whatsapp/send-all-reminders',
      PAYMENT_CONFIRMATION: '/api/whatsapp/send-payment-confirmation'
    },
    
    DASHBOARD: {
      STATS: '/api/dashboard/stats',
      RECENT_PAYMENTS: '/api/dashboard/recent-payments',
      PENDING_TASKS: '/api/dashboard/pending-tasks',
      OCCUPANCY: '/api/dashboard/occupancy',
      REVENUE: '/api/dashboard/revenue'
    },
    
    UPLOAD: {
      IMAGE: '/api/upload/image',
      DOCUMENT: '/api/upload/document',
      BULK: '/api/upload/bulk'
    }
  },
  
  buildURL(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  },
  
  getEndpoint(path, params = {}) {
    let endpoint = path;
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
  setEnvironment(env) {
    if (ENV_CONFIG[env]) {
      localStorage.setItem('ENV_OVERRIDE', env);
      console.log(` Environment set to: ${env}`);
      console.log(' Please refresh the page');
      return true;
    }
    console.error(` Invalid environment: ${env}`);
    return false;
  },
  
  clearEnvironmentOverride() {
    localStorage.removeItem('ENV_OVERRIDE');
    console.log('Environment override cleared');
    console.log('Please refresh the page');
  },
  
  getConfig() {
    return {
      environment: API_CONFIG.ENVIRONMENT,
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      retryAttempts: API_CONFIG.RETRY_ATTEMPTS,
      debug: API_CONFIG.DEBUG,
      cacheTTL: API_CONFIG.CACHE_TTL
    };
  },
  
  printConfig() {
    console.log('═══════════════════════════════════════');
    console.log(' SimamiaKodi API Configuration');
    console.log('═══════════════════════════════════════');
    console.log('Environment:', API_CONFIG.ENVIRONMENT);
    console.log('Base URL:', API_CONFIG.BASE_URL);
    console.log('Timeout:', API_CONFIG.TIMEOUT + 'ms');
    console.log('Retry Attempts:', API_CONFIG.RETRY_ATTEMPTS);
    console.log('Cache TTL:', API_CONFIG.CACHE_TTL + 'ms');
    console.log('Debug Mode:', API_CONFIG.DEBUG);
    console.log('═══════════════════════════════════════');
  },
  
  async testConnection() {
    try {
      console.log(' Testing connection to:', API_CONFIG.BASE_URL);
      const start = performance.now();
      
      const response = await fetch(API_CONFIG.BASE_URL + '/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const end = performance.now();
      const duration = (end - start).toFixed(2);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Connection successful (${duration}ms):`, data);
        return true;
      } else {
        console.warn('Connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error.message);
      return false;
    }
  }
};

// Log configuration on load
if (API_CONFIG.DEBUG) {
  ConfigUtils.printConfig();
  
  if (API_CONFIG.IS_DEVELOPMENT) {
    setTimeout(() => ConfigUtils.testConnection(), 1000);
  }
}

// Make everything globally available
window.API_CONFIG = API_CONFIG;
window.STORAGE_KEYS = STORAGE_KEYS;
window.CacheService = CacheService;
window.ConfigUtils = ConfigUtils;

// Development helpers
if (API_CONFIG.IS_DEVELOPMENT) {
  console.log(' Development Mode Active');
  console.log(' Available commands:');
  console.log('   ConfigUtils.printConfig() - Show config');
  console.log('   ConfigUtils.testConnection() - Test API');
  console.log('   CacheService.printStats() - Show cache stats');
  console.log('   CacheService.clear() - Clear all cache');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, STORAGE_KEYS, CacheService, ConfigUtils };
}