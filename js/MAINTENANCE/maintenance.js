// ===== CONFIGURATION =====
const API_BASE_URL = `${API_CONFIG.BASE_URL}/api/maintenance`;

// Data Management
let maintenanceRequests = [];
let properties = [];
let units = [];
let tenants = [];

// ===== INITIALIZATION =====
async function init() {
    console.log(' Initializing Maintenance Management System...');
    console.log('API Base URL:', API_BASE_URL);
    
    // Check authentication
    const token = getToken();
    if (!token) {
        console.log(' No token found, redirecting to login');
        window.location.href = '/pages/auth/login.html';
        return;
    }
    
    showLoading(true);
    try {
        await loadAllData();
        populatePropertyDropdowns();
        populateUnitDropdowns();
        populateTenantDropdowns();
        renderTable();
        updateStats();
        console.log('✅ Initialization complete');
    } catch (error) {
        console.error(' Initialization failed:', error);
        showNotification('Failed to load data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// ===== DATA LOADING =====
async function loadAllData() {
    await Promise.all([
        fetchProperties(),
        fetchUnits(),
        fetchTenants(),
        fetchMaintenanceRequests()
    ]);
}

async function fetchProperties() {
    try {
        console.log('🔄 Fetching properties...');
        const token = getToken();
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/properties`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.log('Unauthorized - redirecting to login');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log(' Properties response:', result);
        
        if (result && result.success && Array.isArray(result.data)) {
            properties = result.data;
            console.log(`✅ Loaded ${properties.length} properties`);
        } else if (Array.isArray(result)) {
            properties = result;
            console.log(`✅ Loaded ${properties.length} properties (direct array)`);
        } else {
            console.error('❌ Invalid format');
            properties = [];
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        properties = [];
    }
}

async function fetchUnits() {
    try {
        console.log('🔄 Fetching units...');
        const token = getToken();
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/units`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.log('❌ Unauthorized - redirecting to login');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log(' Units response:', result);
        
        if (result && result.success && Array.isArray(result.data)) {
            units = result.data;
            console.log(`✅ Loaded ${units.length} units`);
        } else if (Array.isArray(result)) {
            units = result;
            console.log(`✅ Loaded ${units.length} units (direct array)`);
        } else {
            console.error(' Invalid format');
            units = [];
        }
    } catch (error) {
        console.error(' Fetch error:', error);
        units = [];
    }
}

async function fetchTenants() {
    try {
        console.log('🔄 Fetching tenants...');
        const token = getToken();
        
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/tenants`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.log(' Unauthorized - redirecting to login');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log('📦 Tenants response:', result);
        
        if (result && result.success && Array.isArray(result.data)) {
            tenants = result.data;
            console.log(`✅ Loaded ${tenants.length} tenants`);
        } else if (Array.isArray(result)) {
            tenants = result;
            console.log(`✅ Loaded ${tenants.length} tenants (direct array)`);
        } else {
            console.error('❌ Invalid format');
            tenants = [];
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        tenants = [];
    }
}

async function fetchMaintenanceRequests() {
    try {
        console.log('🔄 Fetching maintenance requests...');
        const token = getToken();
        
        const response = await fetch(`${API_BASE_URL}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            console.log('❌ Unauthorized - redirecting to login');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        console.log('📦 Maintenance requests response:', result);
        
        if (result && result.success && Array.isArray(result.data)) {
            maintenanceRequests = result.data;
        } else if (Array.isArray(result)) {
            maintenanceRequests = result;
        } else {
            maintenanceRequests = [];
        }
        
        console.log(`✅ Loaded ${maintenanceRequests.length} maintenance requests`);
    } catch (error) {
        console.error('❌ Error:', error);
        maintenanceRequests = [];
    }
}

// ===== DROPDOWN POPULATION =====
function populatePropertyDropdowns() {
    const propertySelect = document.getElementById('property');
    const filterProperty = document.getElementById('filterProperty');
    
    console.log('📋 Populating dropdowns with', properties.length, 'properties');
    
    if (propertySelect) {
        propertySelect.innerHTML = '<option value="">Select Property</option>';
        properties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.property_id;
            option.textContent = prop.property_name || prop.name || `Property ${prop.property_id}`;
            propertySelect.appendChild(option);
        });
    }
    
    if (filterProperty) {
        filterProperty.innerHTML = '<option value="">All Properties</option>';
        properties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.property_id;
            option.textContent = prop.property_name || prop.name || `Property ${prop.property_id}`;
            filterProperty.appendChild(option);
        });
    }
}

function populateUnitDropdowns() {
    const unitSelect = document.getElementById('unit');
    if (!unitSelect) return;
    
    unitSelect.innerHTML = '<option value="">Select Unit</option>';
    
    console.log('📋 Populating units dropdown...');
    units.forEach(unit => {
        const prop = properties.find(p => p.property_id === unit.property_id);
        const option = document.createElement('option');
        option.value = unit.unit_id;
        option.setAttribute('data-property', unit.property_id);
        option.textContent = `${unit.unit_number}${prop ? ' - ' + (prop.property_name || prop.name) : ''}`;
        unitSelect.appendChild(option);
    });
}

function populateTenantDropdowns() {
    const tenantSelect = document.getElementById('tenant');
    if (!tenantSelect) return;
    
    tenantSelect.innerHTML = '<option value="">Select Tenant</option>';
    
    console.log('📋 Populating tenants dropdown...');
    tenants.forEach(tenant => {
        const option = document.createElement('option');
        option.value = tenant.tenant_id;
        option.textContent = tenant.full_name || tenant.name || `Tenant ${tenant.tenant_id}`;
        tenantSelect.appendChild(option);
    });
}

// ===== CASCADING DROPDOWNS =====
function onPropertyChange() {
    const propertyId = parseInt(document.getElementById('property').value);
    const unitSelect = document.getElementById('unit');
    
    if (!unitSelect) return;
    
    unitSelect.innerHTML = '<option value="">Select Unit</option>';
    document.getElementById('tenant').value = '';
    
    if (!propertyId) return;
    
    const propertyUnits = units.filter(u => u.property_id == propertyId);
    
    propertyUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit.unit_id;
        option.textContent = unit.unit_number;
        unitSelect.appendChild(option);
    });
}

function onUnitChange() {
    const unitId = parseInt(document.getElementById('unit').value);
    const tenantSelect = document.getElementById('tenant');
    
    if (!tenantSelect || !unitId) {
        if (tenantSelect) tenantSelect.value = '';
        return;
    }
    
    const unitTenants = tenants.filter(t => t.unit_id == unitId);
    
    if (unitTenants.length > 0) {
        tenantSelect.value = unitTenants[0].tenant_id;
    }
}

function filterUnitsByProperty() {
    onPropertyChange();
}

// ===== RENDER TABLE =====
function renderTable() {
    const tbody = document.getElementById('maintenanceTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterPropertyId = document.getElementById('filterProperty').value;
    const filterStatus = document.getElementById('filterStatus').value;
    const filterPriority = document.getElementById('filterPriority').value;
    const filterIssueType = document.getElementById('filterIssueType').value;

    let filtered = maintenanceRequests.filter(req => {
        const property = properties.find(p => p.property_id === req.property_id);
        const unit = units.find(u => u.unit_id === req.unit_id);
        const tenant = tenants.find(t => t.tenant_id === req.tenant_id);
        
        const matchesSearch = !searchTerm || 
            (property && (property.property_name || property.name || '').toLowerCase().includes(searchTerm)) ||
            (unit && unit.unit_number.toLowerCase().includes(searchTerm)) ||
            (tenant && (tenant.full_name || tenant.name || '').toLowerCase().includes(searchTerm)) ||
            (req.description || '').toLowerCase().includes(searchTerm) ||
            (req.issue_type || '').toLowerCase().includes(searchTerm);
        
        const matchesProperty = !filterPropertyId || req.property_id === parseInt(filterPropertyId);
        const matchesStatus = !filterStatus || req.status === filterStatus;
        const matchesPriority = !filterPriority || req.priority === filterPriority;
        const matchesIssueType = !filterIssueType || req.issue_type === filterIssueType;

        return matchesSearch && matchesProperty && matchesStatus && matchesPriority && matchesIssueType;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px;">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No maintenance requests found</h3>
                        <p>Click "Add Request" to create your first maintenance request</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(req => {
        const property = properties.find(p => p.property_id === req.property_id);
        const unit = units.find(u => u.unit_id === req.unit_id);
        const tenant = tenants.find(t => t.tenant_id === req.tenant_id);
        
        return `
        <tr>
            <td>#${req.request_id}</td>
            <td>${property ? (property.property_name || property.name) : 'N/A'}</td>
            <td>${unit ? unit.unit_number : 'N/A'}</td>
            <td>${tenant ? (tenant.full_name || tenant.name) : 'N/A'}</td>
            <td><i class="fas fa-${getIssueIcon(req.issue_type)}"></i> ${capitalizeFirst(req.issue_type)}</td>
            <td>${truncate(req.description, 40)}</td>
            <td><span class="badge badge-${req.priority}">${capitalizeFirst(req.priority)}</span></td>
            <td><span class="badge badge-${req.status.replace('_', '')}">${formatStatus(req.status)}</span></td>
            <td>${formatDate(req.reported_date)}</td>
            <td>KES ${(parseFloat(req.cost) || 0).toLocaleString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="editRequest(${req.request_id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteRequest(${req.request_id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// ===== STATISTICS =====
function updateStats() {
    const pending = maintenanceRequests.filter(r => r.status === 'pending').length;
    const inProgress = maintenanceRequests.filter(r => r.status === 'in_progress').length;
    const completed = maintenanceRequests.filter(r => r.status === 'completed').length;
    const totalCost = maintenanceRequests.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    const pendingEl = document.getElementById('pendingCount');
    const inProgressEl = document.getElementById('inProgressCount');
    const completedEl = document.getElementById('completedCount');
    const totalCostEl = document.getElementById('totalCost');

    if (pendingEl) pendingEl.textContent = pending;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (completedEl) completedEl.textContent = completed;
    if (totalCostEl) totalCostEl.textContent = `KES ${totalCost.toLocaleString()}`;
}

// ===== MODAL FUNCTIONS =====
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Maintenance Request';
    document.getElementById('maintenanceForm').reset();
    document.getElementById('requestId').value = '';
    document.getElementById('reportedDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('maintenanceModal').classList.add('show');
}

function editRequest(request_id) {
    const request = maintenanceRequests.find(r => r.request_id === request_id);
    if (!request) return;

    document.getElementById('modalTitle').textContent = 'Edit Maintenance Request';
    document.getElementById('requestId').value = request.request_id;
    document.getElementById('property').value = request.property_id || '';
    
    onPropertyChange();
    
    setTimeout(() => {
        document.getElementById('unit').value = request.unit_id || '';
        onUnitChange();
        
        setTimeout(() => {
            document.getElementById('tenant').value = request.tenant_id || '';
        }, 100);
    }, 100);
    
    document.getElementById('issueType').value = request.issue_type;
    document.getElementById('priority').value = request.priority;
    document.getElementById('description').value = request.description;
    document.getElementById('status').value = request.status;
    document.getElementById('reportedDate').value = request.reported_date;
    document.getElementById('resolvedDate').value = request.resolved_date || '';
    document.getElementById('assignedTo').value = request.assigned_to || '';
    document.getElementById('cost').value = request.cost || 0;
    document.getElementById('notes').value = request.notes || '';

    document.getElementById('maintenanceModal').classList.add('show');
}

function closeModal() {
    document.getElementById('maintenanceModal').classList.remove('show');
}

async function saveRequest() {
    const form = document.getElementById('maintenanceForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const request_id = document.getElementById('requestId').value;
    const requestData = {
        property_id: parseInt(document.getElementById('property').value),
        unit_id: parseInt(document.getElementById('unit').value),
        tenant_id: document.getElementById('tenant').value ? parseInt(document.getElementById('tenant').value) : null,
        issue_type: document.getElementById('issueType').value,
        priority: document.getElementById('priority').value,
        description: document.getElementById('description').value,
        status: document.getElementById('status').value,
        reported_date: document.getElementById('reportedDate').value,
        resolved_date: document.getElementById('resolvedDate').value || null,
        assigned_to: document.getElementById('assignedTo').value || '',
        cost: parseFloat(document.getElementById('cost').value) || 0,
        notes: document.getElementById('notes').value || ''
    };

    showLoading(true);
    try {
        if (request_id) {
            await apiCall(`/${request_id}`, 'PUT', requestData);
            showNotification('✅ Maintenance request updated successfully', 'success');
        } else {
            await apiCall('', 'POST', requestData);
            showNotification('✅ Maintenance request created successfully', 'success');
        }

        await fetchMaintenanceRequests();
        renderTable();
        updateStats();
        closeModal();
    } catch (error) {
        console.error('Failed to save:', error);
        showNotification(' Failed to save request: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function deleteRequest(request_id) {
    if (!confirm('Are you sure you want to delete this maintenance request?')) return;
    
    showLoading(true);
    try {
        await apiCall(`/${request_id}`, 'DELETE');
        showNotification(' Maintenance request deleted successfully', 'success');
        
        await fetchMaintenanceRequests();
        renderTable();
        updateStats();
    } catch (error) {
        console.error('Failed to delete:', error);
        showNotification('Failed to delete request: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ===== API HELPER =====
async function apiCall(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    if (!token) {
        console.log(' No token found, redirecting to login');
        window.location.href = '/pages/auth/login.html';
        throw new Error('No authentication token');
    }
    
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    
    if (response.status === 401) {
        console.log(' Unauthorized - redirecting to login');
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/pages/auth/login.html';
        throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        return { success: true };
    }
    
    const result = await response.json();
    return result.data || result;
}

// ===== FILTERS =====
function applyFilters() {
    renderTable();
}

function clearFilters() {
    document.getElementById('filterProperty').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterPriority').value = '';
    document.getElementById('filterIssueType').value = '';
    document.getElementById('searchInput').value = '';
    renderTable();
}

// ===== UTILITIES =====
function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatStatus(status) {
    return status.replace('_', ' ').split(' ').map(capitalizeFirst).join(' ');
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, length) {
    return str && str.length > length ? str.substring(0, length) + '...' : str || '';
}

function getIssueIcon(type) {
    const icons = {
        plumbing: 'faucet',
        electrical: 'bolt',
        hvac: 'wind',
        appliance: 'blender',
        structural: 'home',
        other: 'wrench'
    };
    return icons[type] || 'wrench';
}

function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000; animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
`;
document.head.appendChild(style);

// INITIALIZE
window.addEventListener('DOMContentLoaded', init);