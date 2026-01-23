// SimamiaKodi Property Management - Reports Module (Backend Connected)

// Protect page
protectPage();

// Configuration
const API_URL = `${API_CONFIG.BASE_URL}/api`;

// State management
const state = {
    charts: {},
    rawData: {
        payments: [],
        expenses: [],
        properties: [],
        units: [],
        tenants: []
    },
    filters: {
        reportType: 'financial',
        startDate: null,
        endDate: null,
        propertyId: null
    }
};

// Utility functions
const utils = {
    formatCurrency: (amount) => {
        return `KES ${parseFloat(amount || 0).toLocaleString('en-KE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    filterByDateRange: (items, dateField) => {
        const { startDate, endDate } = state.filters;
        if (!startDate && !endDate) return items;

        return items.filter(item => {
            const itemDate = new Date(item[dateField]);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        });
    },

    getMonthlyData: (items, dateField, amountField) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyTotals = new Array(12).fill(0);
        
        items.forEach(item => {
            const date = new Date(item[dateField]);
            const month = date.getMonth();
            monthlyTotals[month] += parseFloat(item[amountField] || 0);
        });

        return { labels: months, data: monthlyTotals };
    },

    showLoading: (show = true) => {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.style.display = show ? 'block' : 'none';
    },

    showError: (message) => {
        console.error('❌', message);
        alert(message);
    }
};

// API Service
const apiService = {
    async fetchData(endpoint) {
        try {
            const token = getToken();
            if (!token) {
                console.error('No auth token found');
                return [];
            }

            const response = await fetch(`${API_URL}/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle both formats: {success: true, data: [...]} or direct array
            if (data.success && data.data) {
                return Array.isArray(data.data) ? data.data : [];
            }
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`❌ Error fetching ${endpoint}:`, error);
            return [];
        }
    },

    async loadAllData() {
        utils.showLoading(true);
        try {
            console.log('🔄 Loading data from backend...');
            
            const [payments, expenses, properties, units, tenants] = await Promise.all([
                this.fetchData('payments'),
                this.fetchData('expenses'),
                this.fetchData('properties'),
                this.fetchData('units'),
                this.fetchData('tenants')
            ]);

            state.rawData = {
                payments: payments || [],
                expenses: expenses || [],
                properties: properties || [],
                units: units || [],
                tenants: tenants || []
            };

            console.log('✅ Data loaded:', {
                payments: state.rawData.payments.length,
                expenses: state.rawData.expenses.length,
                properties: state.rawData.properties.length,
                units: state.rawData.units.length,
                tenants: state.rawData.tenants.length
            });

            // Debug: Show sample data
            if (state.rawData.tenants.length > 0) {
                console.log('📋 Sample tenant:', state.rawData.tenants[0]);
            }
            if (state.rawData.payments.length > 0) {
                console.log('💰 Sample payment:', state.rawData.payments[0]);
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            utils.showError('Failed to load data from server');
            return false;
        } finally {
            utils.showLoading(false);
        }
    }
};

// Data queries with filtering
const dataQueries = {
    getFilteredPayments() {
        let filtered = state.rawData.payments;
        filtered = utils.filterByDateRange(filtered, 'payment_date');

        if (state.filters.propertyId) {
            filtered = filtered.filter(p => {
                const propId = p.property_id || p.propertyId;
                return propId == state.filters.propertyId;
            });
        }

        return filtered;
    },

    getFilteredExpenses() {
        let filtered = state.rawData.expenses;
        filtered = utils.filterByDateRange(filtered, 'expense_date');

        if (state.filters.propertyId) {
            filtered = filtered.filter(e => {
                const propId = e.property_id || e.propertyId;
                return propId == state.filters.propertyId;
            });
        }

        return filtered;
    },

    getAggregatedRevenue() {
        const payments = this.getFilteredPayments();
        return utils.getMonthlyData(payments, 'payment_date', 'amount');
    },

    getExpensesByCategory() {
        const expenses = this.getFilteredExpenses();
        const categories = {};
        
        expenses.forEach(e => {
            const cat = e.category || 'Other';
            categories[cat] = (categories[cat] || 0) + parseFloat(e.amount || 0);
        });

        return {
            labels: Object.keys(categories),
            data: Object.values(categories)
        };
    },

    getPaymentStatusCounts() {
        const payments = this.getFilteredPayments();
        const counts = { paid: 0, pending: 0, overdue: 0 };
        
        payments.forEach(p => {
            const status = (p.status || 'pending').toLowerCase();
            if (status.includes('paid') || status === 'completed') {
                counts.paid++;
            } else if (status.includes('overdue') || status === 'late') {
                counts.overdue++;
            } else {
                counts.pending++;
            }
        });

        return counts;
    },

    getOccupancyData() {
        if (state.filters.propertyId) {
            const property = state.rawData.properties.find(p => 
                (p.property_id || p.id) == state.filters.propertyId
            );
            
            if (property) {
                const occupied = parseInt(property.occupied_units) || 0;
                const total = parseInt(property.total_units) || 0;
                const vacant = total - occupied;
                
                return {
                    occupied: occupied,
                    vacant: vacant,
                    total: total,
                    rate: total > 0 ? ((occupied / total) * 100).toFixed(1) : 0
                };
            }
        }

        const totalUnits = state.rawData.properties.reduce((sum, p) => 
            sum + (parseInt(p.total_units) || 0), 0);
        const occupiedUnits = state.rawData.properties.reduce((sum, p) => 
            sum + (parseInt(p.occupied_units) || 0), 0);
        const vacantUnits = totalUnits - occupiedUnits;

        return {
            occupied: occupiedUnits,
            vacant: vacantUnits,
            total: totalUnits,
            rate: totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : 0
        };
    }
};

// Chart management
const chartManager = {
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const data = dataQueries.getAggregatedRevenue();

        if (state.charts.revenue) {
            state.charts.revenue.data.labels = data.labels;
            state.charts.revenue.data.datasets[0].data = data.data;
            state.charts.revenue.update('none');
            return;
        }

        state.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: data.data,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (context) => utils.formatCurrency(context.parsed.y)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `KES ${value.toLocaleString()}`
                        }
                    }
                }
            }
        });
        console.log('✅ Revenue chart created');
    },

    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;

        const data = dataQueries.getExpensesByCategory();

        if (state.charts.expense) {
            state.charts.expense.data.labels = data.labels;
            state.charts.expense.data.datasets[0].data = data.data;
            state.charts.expense.update('none');
            return;
        }

        const colors = ['#dc3545', '#ffc107', '#0d9488', '#6f42c1', '#fd7e14', '#20c997'];

        state.charts.expense = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: colors.slice(0, data.labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = utils.formatCurrency(context.parsed);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Expense chart created');
    },

    createPaymentStatusChart() {
        const ctx = document.getElementById('paymentStatusChart');
        if (!ctx) return;

        const counts = dataQueries.getPaymentStatusCounts();

        if (state.charts.payment) {
            state.charts.payment.data.datasets[0].data = [counts.paid, counts.pending, counts.overdue];
            state.charts.payment.update('none');
            return;
        }

        state.charts.payment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Paid', 'Pending', 'Overdue'],
                datasets: [{
                    label: 'Number of Payments',
                    data: [counts.paid, counts.pending, counts.overdue],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
        console.log('✅ Payment status chart created');
    },

    createOccupancyChart() {
        const ctx = document.getElementById('occupancyChart');
        if (!ctx) return;

        const occupancy = dataQueries.getOccupancyData();

        if (state.charts.occupancy) {
            state.charts.occupancy.data.datasets[0].data = [occupancy.occupied, occupancy.vacant];
            state.charts.occupancy.update('none');
            return;
        }

        state.charts.occupancy = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Occupied', 'Vacant'],
                datasets: [{
                    data: [occupancy.occupied, occupancy.vacant],
                    backgroundColor: ['#0d9488', '#e0e0e0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const percent = occupancy.total > 0 
                                    ? ((value / occupancy.total) * 100).toFixed(1) 
                                    : 0;
                                return `${label}: ${value} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
        console.log('✅ Occupancy chart created');
    },

    updateAll() {
        console.log('📊 Updating all charts...');
        this.createRevenueChart();
        this.createExpenseChart();
        this.createPaymentStatusChart();
        this.createOccupancyChart();
    }
};

// Report calculations
const reportCalculations = {
    updateFinancialSummary() {
        const payments = dataQueries.getFilteredPayments();
        const expenses = dataQueries.getFilteredExpenses();

        const totalRevenue = payments.reduce((sum, p) => 
            sum + parseFloat(p.amount || 0), 0);
        
        const totalExpenses = expenses.reduce((sum, e) => 
            sum + parseFloat(e.amount || 0), 0);
        
        const netProfit = totalRevenue - totalExpenses;

        this.updateElement('totalRevenue', utils.formatCurrency(totalRevenue));
        this.updateElement('totalExpenses', utils.formatCurrency(totalExpenses));
        this.updateElement('netProfit', utils.formatCurrency(netProfit));
    },

    updateOccupancyRate() {
        const occupancy = dataQueries.getOccupancyData();
        this.updateElement('occupancyRate', `${occupancy.rate}%`);
    },

    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    },

    populateTransactionsTable() {
        const tbody = document.querySelector('#transactionsTable tbody');
        if (!tbody) return;

        const payments = dataQueries.getFilteredPayments()
            .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
            .slice(0, 20);

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
            return;
        }

        console.log('📊 Populating transactions table with', payments.length, 'payments');

        tbody.innerHTML = payments.map(payment => {
            const tenantId = payment.tenant_id || payment.tenantId;
            const propertyId = payment.property_id || payment.propertyId;
            
            const tenant = state.rawData.tenants.find(t => 
                (t.tenant_id || t.id) == tenantId
            );
            
            const property = state.rawData.properties.find(p => 
                (p.property_id || p.id) == propertyId
            );
            
            // Handle all possible tenant name fields from database
            const tenantName = tenant ? 
                (tenant.full_name || tenant.tenant_name || tenant.name || 'Unknown Tenant') : 
                'N/A';
            
            const propertyName = property ? 
                (property.property_name || property.name || 'Unknown Property') : 
                'N/A';
            
            const statusClass = payment.status === 'paid' ? 'success' : 
                               payment.status === 'overdue' ? 'danger' : 'warning';
            
            return `
                <tr>
                    <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>${tenantName}</td>
                    <td>${propertyName}</td>
                    <td>${payment.payment_method || 'Rent'}</td>
                    <td>${utils.formatCurrency(payment.amount)}</td>
                    <td><span class="badge badge-${statusClass}">${payment.status}</span></td>
                </tr>
            `;
        }).join('');
        
        console.log('✅ Transactions table populated');
    }
};

// Event handlers
const eventHandlers = {
    setupListeners() {
        // Report type filter
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.addEventListener('change', (e) => {
                state.filters.reportType = e.target.value;
                this.updateReport();
            });
        }

        // Date filters
        const startDate = document.getElementById('startDate');
        if (startDate) {
            startDate.addEventListener('change', (e) => {
                state.filters.startDate = e.target.value;
                this.updateReport();
            });
        }

        const endDate = document.getElementById('endDate');
        if (endDate) {
            endDate.addEventListener('change', (e) => {
                state.filters.endDate = e.target.value;
                this.updateReport();
            });
        }

        // Property filter
        const property = document.getElementById('property');
        if (property) {
            property.addEventListener('change', (e) => {
                state.filters.propertyId = e.target.value || null;
                this.updateReport();
            });
        }

        console.log('✅ Event listeners setup complete');
    },

    updateReport() {
        console.log('🔄 Updating report...');
        utils.showLoading(true);
        try {
            reportCalculations.updateFinancialSummary();
            reportCalculations.updateOccupancyRate();
            reportCalculations.populateTransactionsTable();
            chartManager.updateAll();
            console.log('✅ Report updated successfully');
        } catch (error) {
            console.error('❌ Update error:', error);
            utils.showError('Failed to update report');
        } finally {
            utils.showLoading(false);
        }
    },

    generatePDF() {
        const element = document.getElementById('reportContent');
        if (!element) {
            utils.showError('Report content not found');
            return;
        }

        console.log('📄 Generating PDF report...');
        const filename = `SimamiaKodi-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Detect mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const options = {
            margin: isMobile ? 5 : 10,
            filename: filename,
            image: { 
                type: 'jpeg', 
                quality: isMobile ? 0.85 : 0.98 // Lower quality on mobile for faster generation
            },
            html2canvas: { 
                scale: isMobile ? 1.5 : 2, // Lower scale on mobile
                logging: false, 
                useCORS: true,
                windowWidth: isMobile ? 800 : 1200 // Adjust width for mobile
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true // Enable compression
            }
        };

        utils.showLoading(true);
        
        html2pdf().set(options).from(element).save()
            .then(() => {
                console.log('✅ PDF generated successfully');
                utils.showLoading(false);
                
                // Show success message
                if (isMobile) {
                    alert('✅ Report downloaded! Check your Downloads folder.');
                }
            })
            .catch((error) => {
                console.error('❌ PDF generation error:', error);
                utils.showError('Failed to generate PDF: ' + error.message);
                utils.showLoading(false);
            });
    },

    populatePropertyFilter() {
        const propertySelect = document.getElementById('property');
        if (!propertySelect) return;

        propertySelect.innerHTML = '<option value="">All Properties</option>';

        state.rawData.properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property.property_id || property.id;
            option.textContent = property.property_name || property.name;
            propertySelect.appendChild(option);
        });
        
        console.log(`✅ Loaded ${state.rawData.properties.length} properties into filter`);
    }
};

// Main app
const app = {
    async initialize() {
        console.log('🚀 Initializing SimamiaKodi Reports...');
        utils.showLoading(true);

        try {
            const dataLoaded = await apiService.loadAllData();
            
            if (!dataLoaded) {
                throw new Error('Failed to load data from backend');
            }

            eventHandlers.setupListeners();
            eventHandlers.populatePropertyFilter();
            eventHandlers.updateReport();

            console.log('✅ Reports initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            utils.showError('Failed to initialize reports. Please check your backend connection.');
        } finally {
            utils.showLoading(false);
        }
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Global functions for HTML onclick handlers
window.updateReport = () => eventHandlers.updateReport();
window.generatePDF = () => eventHandlers.generatePDF();