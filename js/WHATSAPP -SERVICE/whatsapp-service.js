const WhatsAppService = {
    // Configuration - Uses centralized API config
    API_URL: `${API_CONFIG.BASE_URL}/api/whatsapp`,
    currentTenant: null,
    isConnected: false,

    // Message Templates
    templates: {
        rent: (tenant) => ` *RENT REMINDER*

Hello ${tenant.full_name},

This is a friendly reminder that your rent payment is due soon.

 *Details:*
Property: ${tenant.property_name || 'N/A'}
Unit: ${tenant.unit_number || 'N/A'}
Amount: KES ${WhatsAppService.formatMoney(tenant.rent_amount || 0)}
Due Date: ${WhatsAppService.getNextMonthFirst()}

Please make your payment to stay current.

Thank you! 
- Simamiakodi Management`,

        welcome: (tenant) => ` *WELCOME!*

Hello ${tenant.full_name},

Welcome to ${tenant.property_name || 'your new home'}!

 *Your Details:*
Unit: ${tenant.unit_number || 'N/A'}
Move-in Date: ${tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}
Monthly Rent: KES ${WhatsAppService.formatMoney(tenant.rent_amount || 0)}

We're excited to have you as our tenant. If you need anything, don't hesitate to reach out.

Enjoy your stay! 
- Simamiakodi Management`,

        maintenance: (tenant) => `🔧 *MAINTENANCE UPDATE*

Hello ${tenant.full_name},

We wanted to update you on your maintenance request for Unit ${tenant.unit_number || 'N/A'}.

Our team is working on it and will complete it soon.

Thank you for your patience! 
- Simamiakodi Management`,

        payment: (tenant) => `✅ *PAYMENT RECEIVED*

Hello ${tenant.full_name},

We have received your payment. Thank you!

 *Details:*
Property: ${tenant.property_name || 'N/A'}
Unit: ${tenant.unit_number || 'N/A'}
Date: ${new Date().toLocaleDateString()}

Your account is now up to date. ✨

- Simamiakodi Management`,

        overdue: (tenant) => ` *OVERDUE RENT NOTICE*

Hello ${tenant.full_name},

Your rent payment is now overdue.

 *Details:*
Property: ${tenant.property_name || 'N/A'}
Unit: ${tenant.unit_number || 'N/A'}
Amount Due: KES ${WhatsAppService.formatMoney(tenant.rent_balance || tenant.rent_amount || 0)}

Please settle this payment as soon as possible to avoid penalties.

If you have any concerns, please contact us.

- Simamiakodi Management`,

        custom: () => ''
    },

    /**
     * Initialize WhatsApp Service
     * Call this on page load
     */
    init: function() {
        console.log('🟢 Initializing WhatsApp Service...');
        console.log('API URL:', this.API_URL);
        
        // Load WhatsApp HTML component
        this.loadComponent();
        
        // Check WhatsApp status
        this.checkStatus();
        
        // Check status every 30 seconds
        setInterval(() => this.checkStatus(), 30000);

        // Setup character counter
        setTimeout(() => {
            const messageInput = document.getElementById('whatsappMessage');
            if (messageInput) {
                messageInput.addEventListener('input', function() {
                    document.getElementById('whatsappCharCount').textContent = this.value.length;
                });
            }
        }, 100);
    },

    /**
     * Load WhatsApp HTML Component
     */
    loadComponent: function() {
        fetch('../whatsapp/whatsapp.html')
            .then(response => response.text())
            .then(html => {
                const div = document.createElement('div');
                div.innerHTML = html;
                document.body.appendChild(div);
                console.log('✅ WhatsApp component loaded');
            })
            .catch(error => {
                console.error('❌ Error loading WhatsApp component:', error);
            });
    },

    /**
     * Check WhatsApp Connection Status
     */
    checkStatus: async function() {
        try {
            const response = await fetch(`${this.API_URL}/status`);
            const data = await response.json();
            
            const statusDiv = document.getElementById('whatsappStatusIndicator');
            const statusText = document.getElementById('whatsappStatusText');
            const statusDot = statusDiv?.querySelector('.status-dot');
            
            if (!statusDiv) return;

            if (data.ready) {
                this.isConnected = true;
                statusDiv.classList.add('connected');
                statusDiv.classList.remove('disconnected');
                statusDot.classList.add('green');
                statusDot.classList.remove('red');
                statusText.textContent = 'WhatsApp Connected';
                console.log('✅ WhatsApp is connected');
            } else {
                this.isConnected = false;
                statusDiv.classList.add('disconnected');
                statusDiv.classList.remove('connected');
                statusDot.classList.add('red');
                statusDot.classList.remove('green');
                statusText.textContent = 'WhatsApp Not Connected';
                console.log(' WhatsApp not connected');
            }
        } catch (error) {
            console.error('❌ Error checking WhatsApp status:', error);
            this.isConnected = false;
            
            const statusDiv = document.getElementById('whatsappStatusIndicator');
            const statusText = document.getElementById('whatsappStatusText');
            const statusDot = statusDiv?.querySelector('.status-dot');
            
            if (!statusDiv) return;
            
            statusDiv.classList.add('disconnected');
            statusDiv.classList.remove('connected');
            statusDot.classList.add('red');
            statusDot.classList.remove('green');
            statusText.textContent = 'Server Not Running';
        }
    },

    /**
     * Open WhatsApp Modal
     * @param {Object} tenant - Tenant object with full_name, phone, etc.
     */
    openModal: function(tenant) {
        this.currentTenant = tenant;
        
        document.getElementById('whatsappTenantName').value = tenant.full_name || 'N/A';
        document.getElementById('whatsappTenantPhone').value = tenant.phone || 'N/A';
        document.getElementById('whatsappMessage').value = '';
        document.getElementById('whatsappCharCount').textContent = '0';
        
        document.getElementById('whatsappModal').classList.add('show');
    },

    /**
     * Close WhatsApp Modal
     */
    closeModal: function() {
        document.getElementById('whatsappModal').classList.remove('show');
        this.currentTenant = null;
    },

    /**
     * Use a message template
     * @param {string} type - Template type (rent, welcome, maintenance, etc.)
     */
    useTemplate: function(type) {
        if (!this.currentTenant) return;
        
        const message = this.templates[type](this.currentTenant);
        document.getElementById('whatsappMessage').value = message;
        document.getElementById('whatsappCharCount').textContent = message.length;
    },

    /**
     * Send WhatsApp Message
     */
    sendMessage: async function() {
        if (!this.currentTenant) {
            this.showAlert('No tenant selected', 'error');
            return;
        }

        const phone = this.currentTenant.phone;
        const message = document.getElementById('whatsappMessage').value;
        
        if (!message.trim()) {
            this.showAlert('Please enter a message', 'error');
            return;
        }

        if (!phone || phone === 'N/A') {
            this.showAlert('This tenant has no phone number on record', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showAlert('WhatsApp is not connected. Please start the server and scan the QR code.', 'error');
            return;
        }

        const btn = document.getElementById('whatsappSendBtn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';

        try {
            const response = await fetch(`${this.API_URL}/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, message })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert(' WhatsApp message sent successfully!', 'success');
                this.closeModal();
            } else {
                this.showAlert('Failed to send message: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error: Make sure the WhatsApp Node.js server is running', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    /**
     * Send Rent Reminder to Tenant
     * @param {number} tenantId - Tenant ID
     */
    sendRentReminder: async function(tenantId) {
        if (!this.isConnected) {
            this.showAlert('WhatsApp is not connected', 'error');
            return false;
        }

        try {
            const response = await fetch(`${this.API_URL}/send-rent-reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tenantId })
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('✅ Rent reminder sent!', 'success');
                return true;
            } else {
                this.showAlert('Failed to send reminder', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error sending reminder', 'error');
            return false;
        }
    },

    /**
     * Send Payment Confirmation
     * @param {Object} payment - Payment details
     */
    sendPaymentConfirmation: async function(payment) {
        if (!this.isConnected) {
            this.showAlert('WhatsApp is not connected', 'error');
            return false;
        }

        try {
            const response = await fetch(`${this.API_URL}/send-payment-confirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payment)
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert('✅ Payment confirmation sent!', 'success');
                return true;
            } else {
                this.showAlert('Failed to send confirmation', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error sending confirmation', 'error');
            return false;
        }
    },

    /**
     * Send Bulk Reminders to All Tenants
     */
    sendBulkReminders: async function() {
        if (!this.isConnected) {
            this.showAlert('WhatsApp is not connected', 'error');
            return;
        }

        const confirmed = confirm('Send rent reminders to ALL tenants? This may take a while.');
        if (!confirmed) return;

        this.showAlert('Sending reminders to all tenants... Please wait.', 'info');

        try {
            const response = await fetch(`${this.API_URL}/send-all-reminders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.showAlert(`✅ ${data.message}`, 'success');
            } else {
                this.showAlert('Some reminders failed to send', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showAlert('Error sending reminders', 'error');
        }
    },

    /**
     * Show Alert Message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, error, info)
     */
    showAlert: function(message, type) {
        const alert = document.createElement('div');
        alert.className = `whatsapp-alert ${type}`;
        alert.innerHTML = `
            <div class="d-flex align-items-center gap-2">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    },

    /**
     * Format Money
     * @param {number} amount - Amount to format
     * @returns {string} Formatted amount
     */
    formatMoney: function(amount) {
        if (!amount) return '0.00';
        return parseFloat(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    /**
     * Get Next Month First Day
     * @returns {string} Date string
     */
    getNextMonthFirst: function() {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(1);
        return date.toLocaleDateString();
    },

    /**
     * Create WhatsApp Button HTML
     * @param {Object} tenant - Tenant object
     * @returns {string} Button HTML
     */
    createButton: function(tenant) {
        return `
            <button class="btn-action btn-whatsapp" 
                    onclick='WhatsAppService.openModal(${JSON.stringify(tenant).replace(/'/g, "&apos;")})' 
                    title="Send WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </button>
        `;
    }
};

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => WhatsAppService.init());
} else {
    WhatsAppService.init();
}