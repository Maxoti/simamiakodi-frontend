// ===== UTILITY MANAGEMENT APPLICATION =====
const UtilityApp = {
    // Configuration
    config: {
        apiBaseUrl: 'http://localhost:5000/api',
        itemsPerPage: 10
    },

    // State Management
    state: {
        utilities: [],
        properties: [],
        units: [],
        tenants: [],
        filteredUtilities: [],
        currentPage: 1,
        editingId: null
    },

    // ===== INITIALIZATION =====
    async init() {
        console.log('Initializing Utility Management System...');
        this.setupEventListeners();
        await this.loadData();
    },

    setupEventListeners() {
        // Search and filters
        this.addListener('searchInput', 'input', () => this.applyFilters());
        this.addListener('filterProperty', 'change', () => this.applyFilters());
        this.addListener('filterType', 'change', () => this.applyFilters());
        this.addListener('sortSelect', 'change', () => this.handleSort());

        // Property and unit cascading
        this.addListener('property', 'change', (e) => this.onPropertyChange(e.target.value));
        this.addListener('unit', 'change', (e) => this.onUnitChange(e.target.value));

        // Auto-calculations
        this.addListener('previousReading', 'input', () => this.calculateUnits());
        this.addListener('currentReading', 'input', () => this.calculateUnits());
        this.addListener('ratePerUnit', 'input', () => this.calculateAmount());
        this.addListener('amountPaid', 'input', () => this.updatePaymentStatus());

        // Pagination
        this.addListener('prevPage', 'click', () => this.changePage(-1));
        this.addListener('nextPage', 'click', () => this.changePage(1));

        // Clear filters
        this.addListener('clearBtn', 'click', () => this.clearFilters());

        // Modal events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.getElement('utilityModal')?.classList.contains('active')) {
                this.closeModal();
            }
        });

        this.addListener('utilityModal', 'click', (e) => {
            if (e.target.id === 'utilityModal') {
                this.closeModal();
            }
        });
    },

    // Helper: Add event listener safely
    addListener(elementId, event, handler) {
        const element = this.getElement(elementId);
        if (element) {
            element.addEventListener(event, handler);
        }
    },

    // Helper: Get element safely
    getElement(id) {
        return document.getElementById(id);
    },

    // Helper: Get element value safely
    getValue(id) {
        const element = this.getElement(id);
        return element ? element.value : '';
    },

    // Helper: Set element value safely
    setValue(id, value) {
        const element = this.getElement(id);
        if (element) {
            element.value = value || '';
        }
    },

    // ===== DATA LOADING =====
    async loadData() {
        try {
            await Promise.all([
                this.fetchProperties(),
                this.fetchUnits(),
                this.fetchTenants(),
                this.fetchUtilities()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    },

   // ===== DATA LOADING =====
async fetchProperties() {
    try {
        console.log('Fetching properties from:', `${this.config.apiBaseUrl}/properties`);
        const response = await fetch(`${this.config.apiBaseUrl}/properties`);
        const data = await response.json();
        
        console.log('Raw properties data:', data);
        
        // Handle different response formats
        let propertiesArray = [];
        
        if (Array.isArray(data)) {
            propertiesArray = data;
        } else if (data.data && Array.isArray(data.data)) {
            // ✅ YOUR API USES THIS FORMAT
            propertiesArray = data.data;
        } else if (data.properties && Array.isArray(data.properties)) {
            propertiesArray = data.properties;
        } else if (typeof data === 'object' && data !== null) {
            propertiesArray = Object.values(data);
        }
        
        this.state.properties = propertiesArray;
        console.log('Properties stored in state:', this.state.properties);
        
        this.populatePropertyDropdowns();
        console.log(`✅ Loaded ${this.state.properties.length} properties`);
    } catch (error) {
        console.error('❌ Error fetching properties:', error);
        this.state.properties = [];
        this.populatePropertyDropdowns();
    }
},

async fetchUnits() {
    try {
        const response = await fetch(`${this.config.apiBaseUrl}/units`);
        const data = await response.json();
        
        let unitsArray = [];
        if (Array.isArray(data)) {
            unitsArray = data;
        } else if (data.data && Array.isArray(data.data)) {
            unitsArray = data.data;
        } else if (data.units && Array.isArray(data.units)) {
            unitsArray = data.units;
        }
        
        this.state.units = unitsArray;
        console.log(`✅ Loaded ${this.state.units.length} units`);
    } catch (error) {
        console.error('❌ Error fetching units:', error);
        this.state.units = [];
    }
},

async fetchTenants() {
    try {
        const response = await fetch(`${this.config.apiBaseUrl}/tenants`);
        const data = await response.json();
        
        let tenantsArray = [];
        if (Array.isArray(data)) {
            tenantsArray = data;
        } else if (data.data && Array.isArray(data.data)) {
            tenantsArray = data.data;
        } else if (data.tenants && Array.isArray(data.tenants)) {
            tenantsArray = data.tenants;
        }
        
        this.state.tenants = tenantsArray;
        console.log(`✅ Loaded ${this.state.tenants.length} tenants`);
    } catch (error) {
        console.error('❌ Error fetching tenants:', error);
        this.state.tenants = [];
    }
},

async fetchUtilities() {
    try {
        const response = await fetch(`${this.config.apiBaseUrl}/utilities`);
        const data = await response.json();
        
        let utilitiesArray = [];
        if (Array.isArray(data)) {
            utilitiesArray = data;
        } else if (data.data && Array.isArray(data.data)) {
            utilitiesArray = data.data;
        } else if (data.utilities && Array.isArray(data.utilities)) {
            utilitiesArray = data.utilities;
        }
        
        this.state.utilities = utilitiesArray;
        this.state.filteredUtilities = [...this.state.utilities];
        console.log(`✅ Loaded ${this.state.utilities.length} utilities`);
        
        this.renderUtilities();
        this.updateStatistics();
        this.updateResultsInfo();
    } catch (error) {
        console.error('❌ Error fetching utilities:', error);
        this.state.utilities = [];
        this.state.filteredUtilities = [];
        this.renderEmptyState();
    }
},




        
     

    // ===== API WRAPPER METHODS =====
    async apiGet(endpoint) {
        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    },

    async apiPost(endpoint, data) {
        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to create utility');
        }
        return await response.json();
    },

    async apiPut(endpoint, data) {
        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Failed to update utility');
        }
        return await response.json();
    },

    async apiDelete(endpoint) {
        const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete utility');
        }
        return true;
    },

    // ===== CRUD OPERATIONS =====
    async createUtility(data) {
        return await this.apiPost('/utilities', data);
    },

    async updateUtility(id, data) {
        return await this.apiPut(`/utilities/${id}`, data);
    },

    async deleteUtility(id) {
        if (!confirm('Are you sure you want to delete this utility bill?')) {
            return false;
        }
        
        try {
            await this.apiDelete(`/utilities/${id}`);
            this.showSuccess('Utility bill deleted successfully!');
            await this.fetchUtilities();
            return true;
        } catch (error) {
            console.error('Error deleting utility:', error);
            this.showError('Failed to delete utility bill. Please try again.');
            return false;
        }
    },

    // ===== FORM HANDLING =====
    async handleSubmit(event) {
        event.preventDefault();
        
        const formData = this.getFormData();
        console.log('Submitting utility data:', formData);
        
        try {
            if (this.state.editingId) {
                await this.updateUtility(this.state.editingId, formData);
                this.showSuccess('Utility bill updated successfully!');
            } else {
                await this.createUtility(formData);
                this.showSuccess('Utility bill added successfully!');
            }
            
            await this.fetchUtilities();
            this.closeModal();
        } catch (error) {
            console.error('Error saving utility:', error);
            this.showError(`Failed to save utility bill: ${error.message}`);
        }
    },

    getFormData() {
        return {
            unit_id: parseInt(this.getValue('unit')),
            tenant_id: parseInt(this.getValue('tenant')),
            utility_type: this.getValue('utilityType'),
            billing_month: this.getValue('billingMonth') + '-01',
            previous_reading: parseFloat(this.getValue('previousReading')) || 0,
            current_reading: parseFloat(this.getValue('currentReading')),
            units_consumed: parseFloat(this.getValue('unitsConsumed')),
            rate_per_unit: parseFloat(this.getValue('ratePerUnit')),
            amount_due: parseFloat(this.getValue('amountDue')),
            amount_paid: parseFloat(this.getValue('amountPaid')) || 0,
            payment_status: this.getValue('paymentStatus'),
            reading_date: this.getValue('readingDate') || new Date().toISOString().split('T')[0],
            notes: this.getValue('notes')
        };
    },

    // ===== MODAL MANAGEMENT =====
    openModal(utilityId = null) {
        const modal = this.getElement('utilityModal');
        const modalTitle = this.getElement('modalTitle');
        const form = this.getElement('utilityForm');
        
        if (!modal) {
            this.showError('Modal element not found');
            return;
        }
        
        // Reset form
        if (form) form.reset();
        
        if (utilityId) {
            // Edit mode
            const utility = this.state.utilities.find(u => u.utility_id == utilityId);
            if (utility) {
                this.populateForm(utility);
                modalTitle.textContent = 'Edit Utility Bill';
                this.state.editingId = utilityId;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add Utility Bill';
            this.state.editingId = null;
            this.setDefaultReadingDate();
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    populateForm(utility) {
        // Property and cascading
        this.setValue('property', utility.property_id);
        this.onPropertyChange(utility.property_id);
        
        setTimeout(() => {
            this.setValue('unit', utility.unit_id);
            this.onUnitChange(utility.unit_id);
            
            setTimeout(() => {
                this.setValue('tenant', utility.tenant_id);
            }, 100);
        }, 100);
        
        // Form fields
        this.setValue('utilityType', utility.utility_type);
        this.setValue('billingMonth', utility.billing_month ? utility.billing_month.substring(0, 7) : '');
        this.setValue('previousReading', utility.previous_reading || 0);
        this.setValue('currentReading', utility.current_reading);
        this.setValue('unitsConsumed', utility.units_consumed);
        this.setValue('ratePerUnit', utility.rate_per_unit);
        this.setValue('amountDue', utility.amount_due);
        this.setValue('amountPaid', utility.amount_paid || 0);
        this.setValue('paymentStatus', utility.payment_status);
        this.setValue('readingDate', utility.reading_date);
        this.setValue('notes', utility.notes);
    },

    setDefaultReadingDate() {
        const readingDateInput = this.getElement('readingDate');
        if (readingDateInput) {
            readingDateInput.value = new Date().toISOString().split('T')[0];
        }
    },

    closeModal() {
        const modal = this.getElement('utilityModal');
        const form = this.getElement('utilityForm');
        
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        if (form) form.reset();
        this.state.editingId = null;
    },

    // ===== DROPDOWN POPULATION =====
populatePropertyDropdowns() {
    const filterSelect = this.getElement('filterProperty');
    const formSelect = this.getElement('property');
    
    console.log('📋 Populating property dropdowns...', this.state.properties);
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Properties</option>';
        this.state.properties.forEach((property, index) => {
            console.log(`Processing property ${index}:`, property, typeof property);
            
            const option = document.createElement('option');
            
            // If property is just a number or simple value
            if (typeof property !== 'object') {
                option.value = index;
                option.textContent = `Property ${index}`;
            } else {
                option.value = property.property_id || property.id || index;
                
                // Enhanced property name detection
                const propertyName = 
                    property.property_name || 
                    property.name || 
                    property.title || 
                    property.address ||
                    property.location ||
                    `Property ${option.value}`;
                
                option.textContent = propertyName.charAt(0).toUpperCase() + propertyName.slice(1).toLowerCase();
            }
            
            filterSelect.appendChild(option);
            console.log(`Added to filter: ${option.textContent} (value: ${option.value})`);
        });
    }
    
    if (formSelect) {
        formSelect.innerHTML = '<option value="">Select Property</option>';
        this.state.properties.forEach((property, index) => {
            const option = document.createElement('option');
            
            // If property is just a number or simple value
            if (typeof property !== 'object') {
                option.value = index;
                option.textContent = `Property ${index}`;
            } else {
                option.value = property.property_id || property.id || index;
                
                // Enhanced property name detection
                const propertyName = 
                    property.property_name || 
                    property.name || 
                    property.title || 
                    property.address ||
                    property.location ||
                    `Property ${option.value}`;
                
                option.textContent = propertyName.charAt(0).toUpperCase() + propertyName.slice(1).toLowerCase();
            }
            
            formSelect.appendChild(option);
        });
        console.log('✅ Form property dropdown populated with', this.state.properties.length, 'properties');
    }
},

    onPropertyChange(propertyId) {
        const unitSelect = this.getElement('unit');
        if (!unitSelect) return;
        
        unitSelect.innerHTML = '<option value="">Select Unit</option>';
        this.setValue('tenant', '');
        
        if (!propertyId) return;
        
        const propertyUnits = this.state.units.filter(u => u.property_id == propertyId);
        console.log(`Found ${propertyUnits.length} units for property ${propertyId}`);
        
        propertyUnits.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit.unit_id;
            option.textContent = unit.unit_number || `Unit ${unit.unit_id}`;
            unitSelect.appendChild(option);
        });
    },

  onUnitChange(unitId) {
    const tenantSelect = this.getElement('tenant');
    if (!tenantSelect) return;
    
    tenantSelect.innerHTML = '<option value="">Select Tenant</option>';
    
    if (!unitId) return;
    
    console.log('🔍 Looking for tenants in unit:', unitId);
    
    const unitTenants = this.state.tenants.filter(t => {
        // Handle both is_active boolean and status string
        const isActive = t.is_active === true || 
                        (t.status && t.status.toLowerCase() === 'active');
        const matches = t.unit_id == unitId && isActive;
        
        console.log(`Tenant ${t.full_name || t.first_name}: unit_id=${t.unit_id}, is_active=${t.is_active}, matches=${matches}`);
        return matches;
    });
    
    console.log(`✅ Found ${unitTenants.length} active tenants for unit ${unitId}`);
    
    unitTenants.forEach(tenant => {
        const option = document.createElement('option');
        option.value = tenant.tenant_id;
        
        // Handle different name formats
        const tenantName = tenant.full_name || 
                          `${tenant.first_name || ''} ${tenant.last_name || ''}`.trim() ||
                          tenant.name ||
                          `Tenant ${tenant.tenant_id}`;
        
        option.textContent = tenantName;
        tenantSelect.appendChild(option);
        console.log(`➕ Added tenant: ${tenantName}`);
    });
},

    // ===== AUTO-CALCULATIONS =====
    calculateUnits() {
        const previous = parseFloat(this.getValue('previousReading')) || 0;
        const current = parseFloat(this.getValue('currentReading')) || 0;
        const consumed = Math.max(0, current - previous);
        
        this.setValue('unitsConsumed', consumed.toFixed(2));
        this.calculateAmount();
    },

    calculateAmount() {
        const units = parseFloat(this.getValue('unitsConsumed')) || 0;
        const rate = parseFloat(this.getValue('ratePerUnit')) || 0;
        const amount = units * rate;
        
        this.setValue('amountDue', amount.toFixed(2));
    },

    updatePaymentStatus() {
        const due = parseFloat(this.getValue('amountDue')) || 0;
        const paid = parseFloat(this.getValue('amountPaid')) || 0;
        const statusSelect = this.getElement('paymentStatus');
        
        if (!statusSelect) return;
        
        if (paid >= due && due > 0) {
            statusSelect.value = 'paid';
        } else if (paid > 0) {
            statusSelect.value = 'partial';
        } else {
            statusSelect.value = 'pending';
        }
    },

    // ===== RENDERING =====
    renderUtilities() {
        const container = this.getElement('utilitiesList');
        if (!container) return;
        
        const { currentPage } = this.state;
        const { itemsPerPage } = this.config;
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = this.state.filteredUtilities.slice(start, end);

        if (paginatedData.length === 0) {
            this.renderEmptyState();
            return;
        }

        container.innerHTML = paginatedData.map(utility => this.renderUtilityCard(utility)).join('');
        this.updatePaginationControls();
    },
renderUtilityCard(utility) {
    // Safely get values with fallbacks
    const amountDue = Number(utility.amount_due || 0);
    const amountPaid = Number(utility.amount_paid || 0);
    const balance = amountDue - amountPaid;
    const badgeClass = this.getPaymentBadgeClass(utility.payment_status || 'pending');
    const balanceClass = balance > 0 ? 'text-danger' : 'text-success';
    const utilityType = (utility.utility_type || 'unknown').toUpperCase();

    return `
        <div class="utility-card">
            <div class="utility-header">
                <div>
                    <div class="utility-amount">
                        KES ${amountDue.toLocaleString()}
                    </div>
                    <div class="utility-type">
                        ${utilityType}
                    </div>
                </div>
                <span class="utility-badge ${badgeClass}">
                    ${utility.payment_status || 'pending'}
                </span>
            </div>

            <div class="utility-body">
                <p><strong>Property:</strong> ${utility.property_name || 'N/A'}</p>
                <p><strong>Unit:</strong> ${utility.unit_number || 'N/A'}</p>
                <p><strong>Tenant:</strong> ${utility.tenant_name || 'N/A'}</p>
                <p><strong>Billing Month:</strong> ${this.formatDate(utility.billing_month)}</p>
                <p><strong>Units Consumed:</strong> ${utility.units_consumed || 0}</p>
                <p><strong>Rate per Unit:</strong> KES ${utility.rate_per_unit || 0}</p>
                <p><strong>Paid:</strong> KES ${amountPaid.toLocaleString()}</p>
                <p><strong>Balance:</strong> 
                    <span class="${balanceClass}">
                        KES ${balance.toLocaleString()}
                    </span>
                </p>
            </div>

            <div class="utility-actions">
                <button onclick="UtilityApp.openModal(${utility.utility_id})">
                    Edit
                </button>
                <button class="danger" onclick="UtilityApp.deleteUtility(${utility.utility_id})">
                    Delete
                </button>
            </div>
        </div>
    `;
},

    renderEmptyState() {
        const container = this.getElement('utilitiesList');
        if (!container) return;
        
        container.innerHTML = `
            <p style="text-align: center; color: #999; padding: 40px;">
                No utilities found. Click "Add Utility Bill" to create your first utility entry.
            </p>
        `;
    },

    // ===== FILTERING & SORTING =====
    applyFilters() {
        const searchTerm = this.getValue('searchInput').toLowerCase();
        const propertyFilter = this.getValue('filterProperty');
        const typeFilter = this.getValue('filterType');
        
        this.state.filteredUtilities = this.state.utilities.filter(utility => {
            const matchesSearch = !searchTerm || 
                this.matchesSearchTerm(utility, searchTerm);
            
            const matchesProperty = !propertyFilter || 
                utility.property_id == propertyFilter;
            
            const matchesType = !typeFilter || 
                utility.utility_type === typeFilter;
            
            return matchesSearch && matchesProperty && matchesType;
        });
        
        this.state.currentPage = 1;
        this.renderUtilities();
        this.updateResultsInfo();
    },

    matchesSearchTerm(utility, searchTerm) {
        const searchableFields = [
            utility.utility_type,
            utility.property_name,
            utility.unit_number,
            utility.tenant_name,
            utility.notes
        ];
        
        return searchableFields.some(field => 
            field && field.toString().toLowerCase().includes(searchTerm)
        );
    },

    clearFilters() {
        this.setValue('searchInput', '');
        this.setValue('filterProperty', '');
        this.setValue('filterType', '');
        
        this.state.filteredUtilities = [...this.state.utilities];
        this.state.currentPage = 1;
        this.renderUtilities();
        this.updateResultsInfo();
    },

    handleSort() {
        const sortValue = this.getValue('sortSelect');
        
        this.state.filteredUtilities.sort((a, b) => {
            switch(sortValue) {
                case 'date-desc':
                    return new Date(b.billing_month) - new Date(a.billing_month);
                case 'date-asc':
                    return new Date(a.billing_month) - new Date(b.billing_month);
                case 'amount-desc':
                    return b.amount_due - a.amount_due;
                case 'amount-asc':
                    return a.amount_due - b.amount_due;
                default:
                    return 0;
            }
        });
        
        this.renderUtilities();
    },

    // ===== PAGINATION =====
    changePage(direction) {
        const totalPages = Math.ceil(this.state.filteredUtilities.length / this.config.itemsPerPage);
        const newPage = this.state.currentPage + direction;
        
        if (newPage >= 1 && newPage <= totalPages) {
            this.state.currentPage = newPage;
            this.renderUtilities();
        }
    },

    updatePaginationControls() {
        const totalPages = Math.ceil(this.state.filteredUtilities.length / this.config.itemsPerPage) || 1;
        const pageInfo = this.getElement('pageInfo');
        const prevBtn = this.getElement('prevPage');
        const nextBtn = this.getElement('nextPage');
        
        if (pageInfo) {
            pageInfo.textContent = `Page ${this.state.currentPage} of ${totalPages}`;
        }
        
        if (prevBtn) {
            prevBtn.disabled = this.state.currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.state.currentPage === totalPages;
        }
    },

    // ===== STATISTICS =====
    updateStatistics() {
        const stats = this.calculateStatistics();
        
        this.setElementText('totalElectricity', `KES ${stats.electricity.toLocaleString()}`);
        this.setElementText('totalWater', `KES ${stats.water.toLocaleString()}`);
        this.setElementText('totalInternet', `KES ${stats.other.toLocaleString()}`);
        this.setElementText('totalUtilities', `KES ${stats.total.toLocaleString()}`);
    },

    calculateStatistics() {
        const stats = {
            electricity: 0,
            water: 0,
            other: 0,
            total: 0
        };
        
        this.state.utilities.forEach(utility => {
            const amount = parseFloat(utility.amount_due) || 0;
            stats.total += amount;
            
            const type = (utility.utility_type || '').toLowerCase();
            if (type === 'electricity') {
                stats.electricity += amount;
            } else if (type === 'water') {
                stats.water += amount;
            } else {
                stats.other += amount;
            }
        });
        
        return stats;
    },

    updateResultsInfo() {
        const resultsInfo = this.getElement('resultsInfo');
        if (resultsInfo) {
            const count = this.state.filteredUtilities.length;
            resultsInfo.textContent = `Showing ${count} ${count === 1 ? 'utility' : 'utilities'}`;
        }
    },

    // ===== HELPER METHODS =====
    setElementText(id, text) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = text;
        }
    },

    getPaymentBadgeClass(status) {
        const badges = {
            'paid': 'badge-paid',
            'partial': 'badge-partial',
            'pending': 'badge-pending'
        };
        return badges[status] || 'badge-pending';
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-KE', {
                year: 'numeric',
                month: 'long'
            });
        } catch {
            return dateString;
        }
    },

    // ===== NOTIFICATIONS =====
    showSuccess(message) {
        alert(message);
    },

    showError(message) {
        alert('Error: ' + message);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UtilityApp.init();
});
