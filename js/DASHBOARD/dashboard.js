 const API_BASE = 'http://localhost:5000/api';
        
        // Auth functions
        function getToken() {
            return localStorage.getItem('token');
        }
        
        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }
        
        // Format money
        function formatMoney(amount) {
            if (!amount) return '0';
            if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
            if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
            return amount.toLocaleString();
        }
        
        // Fetch from API with timeout
        async function fetchAPI(endpoint, timeoutMs = 5000) {
            try {
                console.log(`Fetching: ${API_BASE}${endpoint}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                
                const response = await fetch(`${API_BASE}${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    console.error(`Failed to fetch ${endpoint}: ${response.status}`);
                    return [];
                }
                
                const result = await response.json();
                console.log(`${endpoint} result:`, result);
                return result.data || [];
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.error(`Timeout fetching ${endpoint}`);
                } else {
                    console.error(`Error fetching ${endpoint}:`, error);
                }
                return [];
            }
        }
        
        // Update stat
        function updateStat(id, value, change) {
            const el = document.getElementById(id);
            const changeEl = document.getElementById(id.replace(/[A-Z]/g, m => m.toLowerCase()) + 'Change');
            if (el) el.textContent = value;
            if (changeEl) changeEl.textContent = change;
        }
// Check authentication and display user info
function initDashboard() {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (!token) {
        // Not authenticated, redirect to login
        window.location.href = 'pages/auth/login.html';
        return;
    }
    
    // Display user information
    displayUserInfo();
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
            
            // You can also display email, role, etc.
            console.log('Logged in as:', user);
        }
    } catch (error) {
        console.error('Error displaying user info:', error);
    }
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);
        // Load dashboard
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
                    fetchAPI('/maintenance'),
                    fetchAPI('/agents')
                ]);
                
                // Extract data, using empty array if any fetch failed
                const [properties, units, tenants, payments, expenses, agents, caretakers, maintenance] = 
                    results.map(result => result.status === 'fulfilled' ? result.value : []);
                
                const endTime = performance.now();
                console.log(`✅ Data loaded in ${(endTime - startTime).toFixed(0)}ms`);
                console.log('Data counts:', { 
                    properties: properties.length, 
                    units: units.length, 
                    tenants: tenants.length,
                    payments: payments.length,
                    expenses: expenses.length,
                    agents: agents.length,
                    caretakers: caretakers.length,
                    maintenance: maintenance.length
                });
                
                // Properties
                updateStat('totalProperties', properties.length, `${properties.length} properties`);
                
                // Tenants
                const activeTenants = tenants.filter(t => t.is_active).length;
                updateStat('activeTenants', activeTenants, `${tenants.length - activeTenants} inactive`);
                
                // Revenue (from occupied units)
                const revenue = units.filter(u => u.is_occupied)
                    .reduce((sum, u) => sum + parseFloat(u.monthly_rent || 0), 0);
                updateStat('monthlyRevenue', `KES ${formatMoney(revenue)}`, 
                    `From ${units.filter(u => u.is_occupied).length} units`);
                
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
                updateStat('pendingIssues', pendingMaintenance, 
                    `${maintenance.length - pendingMaintenance} resolved`);
                
                // Agents
                const activeAgents = agents.filter(a => a.is_active !== false).length;
                updateStat('activeAgents', activeAgents, `${activeAgents} verified`);
                
                // Caretakers
                const activeCaretakers = caretakers.filter(c => c.is_active !== false).length;
                updateStat('caretakers', activeCaretakers, `${activeCaretakers} on duty`);
                
                // Payment Plans (placeholder)
                updateStat('paymentPlans', '0', 'No active plans');
                
                // Load payments table
                loadPaymentsTable(payments, tenants, units);
                
                // Load pending tasks
                loadPendingTasks(maintenance, tenants);
                
                console.log('✅ Dashboard loaded successfully');
                
            } catch (error) {
                console.error('❌ Error loading dashboard:', error);
            }
        }
        
        // Load payments table
        function loadPaymentsTable(payments, tenants, units) {
            const tbody = document.getElementById('recentPaymentsTable');
            
            if (!payments || payments.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No payments found</td></tr>';
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
                        <td>${tenant ? tenant.full_name : 'Unknown'}</td>
                        <td>${unit ? unit.unit_number : 'Unknown'}</td>
                        <td>KES ${parseFloat(p.amount || 0).toLocaleString()}</td>
                        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
                        <td><span class="badge bg-success">Paid</span></td>
                    </tr>
                `;
            }).join('');
        }
        
        // Load pending tasks
        function loadPendingTasks(maintenance, tenants) {
            const tasksList = document.getElementById('pendingTasksList');
            
            const pendingMaintenance = maintenance.filter(m => 
                m.status === 'pending' || m.status === 'in_progress').length;
            
            const activeTenants = tenants.filter(t => t.is_active).length;
            const inactiveTenants = tenants.length - activeTenants;
            
            tasksList.innerHTML = `
                <div class="list-group list-group-flush">
                    <div class="list-group-item px-0">
                        <div class="d-flex justify-content-between">
                            <span>Maintenance requests</span>
                            <span class="badge bg-${pendingMaintenance > 0 ? 'danger' : 'success'}">${pendingMaintenance}</span>
                        </div>
                    </div>
                    <div class="list-group-item px-0">
                        <div class="d-flex justify-content-between">
                            <span>Active tenants</span>
                            <span class="badge bg-success">${activeTenants}</span>
                        </div>
                    </div>
                    <div class="list-group-item px-0">
                        <div class="d-flex justify-content-between">
                            <span>Inactive tenants</span>
                            <span class="badge bg-warning">${inactiveTenants}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            console.log(' Dashboard initializing...');
            loadDashboard();
        });
