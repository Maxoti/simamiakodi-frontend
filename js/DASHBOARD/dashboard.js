// ===== CONFIGURATION =====
const API_BASE = `${API_CONFIG.BASE_URL}/api`;

// ===== AUTHENTICATION =====
function getToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('remember_me');
        window.location.href = 'pages/auth/login.html';
    }
}

// ===== INITIALIZATION =====
function initDashboard() {
    console.log(' Initializing Dashboard...');
    console.log('API Base URL:', API_BASE);
    
    // Check if user is authenticated
    const token = getToken();
    
    if (!token) {
        console.warn(' Not authenticated, redirecting to login');
        window.location.href = 'pages/auth/login.html';
        return;
    }
    
    // Display user information
    displayUserInfo();
    
    // Load dashboard data
    loadDashboard();
}

function displayUserInfo() {
    try {
        const userData = localStorage.getItem('user_data');
        
        if (userData) {
            const user = JSON.parse(userData);
            
            // Update user name
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = user.fullName || user.full_name || user.username;
            });
            
            // Update avatar
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                const displayName = user.fullName || user.full_name || user.username;
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=198754&color=fff`;
                userAvatar.alt = displayName;
            }
            
            console.log(' Logged in as:', user.username || user.fullName);
        }
    } catch (error) {
        console.error('❌ Error displaying user info:', error);
    }
}

// ===== UTILITY FUNCTIONS =====
function formatMoney(amount) {
    if (!amount) return '0';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return amount.toLocaleString();
}

function updateStat(id, value, change) {
    const el = document.getElementById(id);
    const changeEl = document.getElementById(id.replace(/[A-Z]/g, m => m.toLowerCase()) + 'Change');
    if (el) el.textContent = value;
    if (changeEl) changeEl.textContent = change;
}

// ===== API FUNCTIONS =====
async function fetchAPI(endpoint, timeoutMs = 5000) {
    try {
        console.log(`🔄 Fetching: ${API_BASE}${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error(`❌ Failed to fetch ${endpoint}: ${response.status}`);
            return [];
        }
        
        const result = await response.json();
        console.log(`✅ ${endpoint} result:`, result);
        
        // Handle different response formats
        if (result.success && Array.isArray(result.data)) {
            return result.data;
        } else if (Array.isArray(result)) {
            return result;
        } else if (result.data) {
            return result.data;
        }
        
        return [];
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`⏱️ Timeout fetching ${endpoint}`);
        } else {
            console.error(`❌ Error fetching ${endpoint}:`, error);
        }
        return [];
    }
}

// ===== DASHBOARD LOADING =====
async function loadDashboard() {
    console.log(' Loading dashboard...');
    const startTime = performance.now();
    
    try {
        // Fetch all data in parallel with Promise.allSettled (won't fail if one API fails)
        const results = await Promise.allSettled([
            fetchAPI('/properties'),
            fetchAPI('/units'),
            fetchAPI('/tenants'),
            fetchAPI('/payments'),
            fetchAPI('/expenses'),
            fetchAPI('/agents'),
            fetchAPI('/caretaker'),
            fetchAPI('/maintenance')
        ]);
        
        // Extract data, using empty array if any fetch failed
        const [properties, units, tenants, payments, expenses, agents, caretakers, maintenance] = 
            results.map(result => result.status === 'fulfilled' ? result.value : []);
        
        const endTime = performance.now();
        console.log(`✅ Data loaded in ${(endTime - startTime).toFixed(0)}ms`);
        console.log('📦 Data counts:', { 
            properties: properties.length, 
            units: units.length, 
            tenants: tenants.length,
            payments: payments.length,
            expenses: expenses.length,
            agents: agents.length,
            caretakers: caretakers.length,
            maintenance: maintenance.length
        });
        
        // Update all statistics
        updateDashboardStats({
            properties,
            units,
            tenants,
            payments,
            expenses,
            agents,
            caretakers,
            maintenance
        });
        
        // Load tables and lists
        loadPaymentsTable(payments, tenants, units);
        loadPendingTasks(maintenance, tenants);
        
        console.log('✅ Dashboard loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
}

// ===== UPDATE STATISTICS =====
function updateDashboardStats(data) {
    const { properties, units, tenants, payments, expenses, agents, caretakers, maintenance } = data;
    
    // Properties
    updateStat('totalProperties', properties.length, `${properties.length} properties`);
    
    // Tenants
    const activeTenants = tenants.filter(t => t.is_active === true || t.status === 'active').length;
    updateStat('activeTenants', activeTenants, `${tenants.length - activeTenants} inactive`);
    
    // Revenue (from occupied units)
    const revenue = units.filter(u => u.is_occupied || u.status === 'occupied')
        .reduce((sum, u) => sum + parseFloat(u.monthly_rent || u.rent_amount || 0), 0);
    const occupiedCount = units.filter(u => u.is_occupied || u.status === 'occupied').length;
    updateStat('monthlyRevenue', `KES ${formatMoney(revenue)}`, `From ${occupiedCount} units`);
    
    // Expenses
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthExpenses = expenses
        .filter(e => e.expense_date && e.expense_date.startsWith(currentMonth))
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    updateStat('monthlyExpenses', `KES ${formatMoney(monthExpenses)}`, 'This month');
    
    // Maintenance
    const pendingMaintenance = maintenance.filter(m => 
        m.status === 'pending' || m.status === 'in_progress').length;
    const resolvedMaintenance = maintenance.length - pendingMaintenance;
    updateStat('pendingIssues', pendingMaintenance, `${resolvedMaintenance} resolved`);
    
    // Agents
    const activeAgents = agents.filter(a => a.is_active !== false && a.status !== 'inactive').length;
    updateStat('activeAgents', activeAgents, `${activeAgents} verified`);
    
    // Caretakers
    const activeCaretakers = caretakers.filter(c => c.is_active !== false && c.status !== 'inactive').length;
    updateStat('caretakers', activeCaretakers, `${activeCaretakers} on duty`);
    
    // Payment Plans (placeholder - update when you have payment plans endpoint)
    updateStat('paymentPlans', '0', 'No active plans');
}

// ===== PAYMENTS TABLE =====
function loadPaymentsTable(payments, tenants, units) {
    const tbody = document.getElementById('recentPaymentsTable');
    
    if (!tbody) {
        console.warn('⚠️ recentPaymentsTable element not found');
        return;
    }
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No payments found</td></tr>';
        return;
    }
    
    const recent = payments
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 5);
    
    tbody.innerHTML = recent.map(p => {
        const tenant = tenants.find(t => t.tenant_id === p.tenant_id);
        const unit = units.find(u => u.unit_id === p.unit_id);
        
        return `
            <tr>
                <td>${tenant ? (tenant.full_name || tenant.name) : 'Unknown'}</td>
                <td>${unit ? unit.unit_number : 'Unknown'}</td>
                <td>KES ${parseFloat(p.amount || 0).toLocaleString()}</td>
                <td>${new Date(p.payment_date).toLocaleDateString('en-KE', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })}</td>
                <td><span class="badge bg-success">Paid</span></td>
            </tr>
        `;
    }).join('');
}

// ===== PENDING TASKS =====
function loadPendingTasks(maintenance, tenants) {
    const tasksList = document.getElementById('pendingTasksList');
    
    if (!tasksList) {
        console.warn('⚠️ pendingTasksList element not found');
        return;
    }
    
    const pendingMaintenance = maintenance.filter(m => 
        m.status === 'pending' || m.status === 'in_progress').length;
    
    const activeTenants = tenants.filter(t => t.is_active === true || t.status === 'active').length;
    const inactiveTenants = tenants.length - activeTenants;
    
    tasksList.innerHTML = `
        <div class="list-group list-group-flush">
            <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="fas fa-tools me-2"></i>
                        Maintenance requests
                    </span>
                    <span class="badge bg-${pendingMaintenance > 0 ? 'danger' : 'success'}">${pendingMaintenance}</span>
                </div>
            </div>
            <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="fas fa-user-check me-2"></i>
                        Active tenants
                    </span>
                    <span class="badge bg-success">${activeTenants}</span>
                </div>
            </div>
            <div class="list-group-item px-0">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="fas fa-user-times me-2"></i>
                        Inactive tenants
                    </span>
                    <span class="badge bg-warning">${inactiveTenants}</span>
                </div>
            </div>
        </div>
    `;
}

// ===== INITIALIZE ON DOM LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    console.log(' DOM loaded, initializing dashboard...');
    initDashboard();
});