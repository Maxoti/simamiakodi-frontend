// ============================================
// UTILITY HELPER FUNCTIONS
// ============================================

// -------------------- LOADING SPINNER --------------------

/**
 * Show loading spinner/overlay
 */
function showLoading() {
  let loader = document.getElementById('loader');
  
  // Create loader if it doesn't exist
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
      <div class="loader-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
    document.body.appendChild(loader);
  }
  
  loader.style.display = 'flex';
}

/**
 * Hide loading spinner/overlay
 */
function hideLoading() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// -------------------- NOTIFICATIONS --------------------

/**
 * Show notification message
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Add icon based on type
  const icon = getNotificationIcon(type);
  
  notification.innerHTML = `
    <span class="notification-icon">${icon}</span>
    <span class="notification-message">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;
  
  // Add to container
  container.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.add('notification-show');
  }, 10);
  
  // Auto remove after duration
  setTimeout(() => {
    notification.classList.remove('notification-show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - Icon HTML
 */
function getNotificationIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

// -------------------- FORMATTING --------------------

/**
 * Format number as currency (Kenyan Shillings)
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'KES 0.00';
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'long', 'short', 'medium'
 * @returns {string} - Formatted date string
 */
function formatDate(date, format = 'long') {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options = {
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    short: { year: 'numeric', month: '2-digit', day: '2-digit' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' }
  };
  
  return dateObj.toLocaleDateString('en-KE', options[format] || options.long);
}

/**
 * Format date and time
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} - Formatted datetime string
 */
function formatDateTime(datetime) {
  if (!datetime) return 'N/A';
  
  const dateObj = new Date(datetime);
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format phone number to Kenyan format
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert to +254 format
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('en-KE');
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} - Relative time string
 */
function getRelativeTime(date) {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date, 'short');
}

// -------------------- VALIDATION --------------------

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Kenyan phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function isValidPhone(phone) {
  if (!phone) return false;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check Kenyan phone formats
  // 0712345678, 0112345678, +254712345678, 254712345678
  const phoneRegex = /^(254|0)?(7|1)\d{8}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} - True if not empty
 */
function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} - True if meets minimum
 */
function minLength(value, minLength) {
  if (!value) return false;
  return value.length >= minLength;
}

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if under maximum
 */
function maxLength(value, maxLength) {
  if (!value) return true;
  return value.length <= maxLength;
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} - True if in range
 */
function inRange(value, min, max) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

// -------------------- FORM HANDLING --------------------

/**
 * Get form data as object
 * @param {HTMLFormElement} form - Form element
 * @returns {object} - Form data as key-value pairs
 */
function getFormData(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    // Handle multiple values (checkboxes, multi-select)
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }
  
  return data;
}

/**
 * Clear form fields
 * @param {HTMLFormElement} form - Form to clear
 */
function clearForm(form) {
  if (!form) return;
  form.reset();
  
  // Clear any validation errors
  const errorElements = form.querySelectorAll('.error-message');
  errorElements.forEach(el => el.remove());
  
  const errorInputs = form.querySelectorAll('.input-error');
  errorInputs.forEach(el => el.classList.remove('input-error'));
}

/**
 * Show form field error
 * @param {HTMLInputElement} field - Input field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
  if (!field) return;
  
  // Add error class
  field.classList.add('input-error');
  
  // Remove existing error message
  const existingError = field.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);
}

/**
 * Clear field error
 * @param {HTMLInputElement} field - Input field
 */
function clearFieldError(field) {
  if (!field) return;
  
  field.classList.remove('input-error');
  
  const errorMessage = field.parentElement.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

// -------------------- MODALS --------------------

/**
 * Open modal
 * @param {string} modalId - ID of modal to open
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = 'block';
  document.body.classList.add('modal-open');
  
  // Add close handlers
  const closeBtn = modal.querySelector('.close, .modal-close');
  if (closeBtn) {
    closeBtn.onclick = () => closeModal(modalId);
  }
  
  // Close on outside click
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal(modalId);
    }
  };
}

/**
 * Close modal
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  
  // Clear form if exists
  const form = modal.querySelector('form');
  if (form) {
    clearForm(form);
  }
}

// -------------------- BOOTSTRAP MODALS --------------------

/**
 * Show Bootstrap modal
 * @param {string} modalId - ID of Bootstrap modal to show
 */
function showBootstrapModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl) return;
  
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

/**
 * Hide Bootstrap modal
 * @param {string} modalId - ID of Bootstrap modal to hide
 */
function hideBootstrapModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl) return;
  
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

// -------------------- BOOTSTRAP TOASTS --------------------

/**
 * Show Bootstrap toast notification
 * @param {string} message - Toast message
 * @param {string} type - Type: 'success', 'danger', 'warning', 'info', 'primary', 'secondary'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showBootstrapToast(message, type = 'info', duration = 3000) {
  const toastId = `toast-${Date.now()}`;
  const bgClass = `bg-${type}`;
  
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = `toast ${bgClass} text-white position-fixed top-0 end-0 m-3`;
  toastEl.style.zIndex = '9999';
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="toast-body d-flex justify-content-between align-items-center">
      <span>${message}</span>
      <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  document.body.appendChild(toastEl);
  
  const toast = new bootstrap.Toast(toastEl, { delay: duration });
  toast.show();
  
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// -------------------- CONFIRMATIONS --------------------

/**
 * Confirm action with user
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 */
function confirmAction(message, onConfirm, onCancel) {
  if (confirm(message)) {
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
    return true;
  } else {
    if (typeof onCancel === 'function') {
      onCancel();
    }
    return false;
  }
}

/**
 * Show custom confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  
  overlay.innerHTML = `
    <div class="confirm-dialog">
      <div class="confirm-header">
        <h3>${title}</h3>
      </div>
      <div class="confirm-body">
        <p>${message}</p>
      </div>
      <div class="confirm-footer">
        <button class="btn btn-secondary confirm-cancel">Cancel</button>
        <button class="btn btn-primary confirm-ok">Confirm</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Handle confirm
  overlay.querySelector('.confirm-ok').onclick = () => {
    if (typeof onConfirm === 'function') {
      onConfirm();
    }
    overlay.remove();
  };
  
  // Handle cancel
  overlay.querySelector('.confirm-cancel').onclick = () => {
    if (typeof onCancel === 'function') {
      onCancel();
    }
    overlay.remove();
  };
  
  // Close on outside click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      if (typeof onCancel === 'function') {
        onCancel();
      }
      overlay.remove();
    }
  };
}

// -------------------- LOCAL STORAGE --------------------

/**
 * Save to local storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Load from local storage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} - Stored value or default
 */
function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Remove from local storage
 * @param {string} key - Storage key
 */
function removeFromLocalStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
    return false;
  }
}

/**
 * Clear all local storage
 */
function clearLocalStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
    return false;
  }
}

// -------------------- URL & QUERY PARAMS --------------------

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value or null
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Set query parameter in URL
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

/**
 * Remove query parameter from URL
 * @param {string} param - Parameter name
 */
function removeQueryParam(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.pushState({}, '', url);
}

// -------------------- DEBOUNCE & THROTTLE --------------------

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// -------------------- TABLE UTILITIES --------------------

/**
 * Sort table by column
 * @param {HTMLTableElement} table - Table element
 * @param {number} columnIndex - Column index to sort
 * @param {boolean} ascending - Sort direction
 */
function sortTable(table, columnIndex, ascending = true) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();
    
    // Try to parse as number
    const aNum = parseFloat(aValue);
    const bNum = parseFloat(bValue);
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }
    
    // String comparison
    return ascending 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
  
  // Re-append sorted rows
  rows.forEach(row => tbody.appendChild(row));
}

/**
 * Filter table rows
 * @param {HTMLTableElement} table - Table element
 * @param {string} searchTerm - Search term
 */
function filterTable(table, searchTerm) {
  const tbody = table.querySelector('tbody');
  const rows = tbody.querySelectorAll('tr');
  const term = searchTerm.toLowerCase();
  
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

// -------------------- EXPORT FUNCTIONS --------------------

/**
 * Export table to CSV
 * @param {HTMLTableElement} table - Table to export
 * @param {string} filename - CSV filename
 */
function exportTableToCSV(table, filename = 'export.csv') {
  const rows = table.querySelectorAll('tr');
  const csv = [];
  
  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const rowData = Array.from(cols).map(col => {
      let data = col.textContent.trim();
      // Escape quotes
      data = data.replace(/"/g, '""');
      return `"${data}"`;
    });
    csv.push(rowData.join(','));
  });
  
  downloadFile(csv.join('\n'), filename, 'text/csv');
}

/**
 * Download file
 * @param {string} content - File content
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------- MISCELLANEOUS --------------------

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard', 'success');
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotification('Failed to copy to clipboard', 'error');
    return false;
  }
}

/**
 * Scroll to element
 * @param {string|HTMLElement} element - Element or selector
 * @param {object} options - Scroll options
 */
function scrollToElement(element, options = { behavior: 'smooth', block: 'start' }) {
  const el = typeof element === 'string' 
    ? document.querySelector(element) 
    : element;
    
  if (el) {
    el.scrollIntoView(options);
  }
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated string
 */
function truncate(str, length = 50) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

// -------------------- EXPORT FOR MODULE USE --------------------

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showLoading,
    hideLoading,
    showNotification,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatPhoneNumber,
    formatNumber,
    getRelativeTime,
    isValidEmail,
    isValidPhone,
    isRequired,
    minLength,
    maxLength,
    inRange,
    getFormData,
    clearForm,
    showFieldError,
    clearFieldError,
    openModal,
    closeModal,
    showBootstrapModal,
    hideBootstrapModal,
    showBootstrapToast,
    confirmAction,
    showConfirmDialog,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    clearLocalStorage,
    getQueryParam,
    setQueryParam,
    removeQueryParam,
    debounce,
    throttle,
    sortTable,
    filterTable,
    exportTableToCSV,
    downloadFile,
    copyToClipboard,
    scrollToElement,
    generateId,
    capitalize,
    truncate
  };
}