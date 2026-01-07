// SimamiaKodi Property Management - Reports Module (Backend Connected)

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5000/api',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// State management
const state = {
    charts: {},
    cache: new Map(),
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
        console.error(message);
        alert(message);
    }
};

// API Service - Pull data from your backend
const apiService = {
    async fetchData(endpoint) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/${endpoint}`);
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
            console.error(`Error fetching ${endpoint}:`, error);
            return [];
        }
    },

    async loadAllData() {
        utils.showLoading(true);
        try {
            console.log('Loading data from backend...');
            
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

            console.log('Data loaded:', {
                payments: state.rawData.payments.length,
                expenses: state.rawData.expenses.length,
                properties: state.rawData.properties.length,
                units: state.rawData.units.length,
                tenants: state.rawData.tenants.length
            });

            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
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

        // Filter by date range
        filtered = utils.filterByDateRange(filtered, 'payment_date');

        // Filter by property if selected
        if (state.filters.propertyId) {
            filtered = filtered.filter(p => {
                // Handle both property_id formats
                const propId = p.property_id || p.propertyId;
                return propId == state.filters.propertyId;
            });
        }

        return filtered;
    },

    getFilteredExpenses() {
        let filtered = state.rawData.expenses;

        // Filter by date range
        filtered = utils.filterByDateRange(filtered, 'expense_date');

        // Filter by property if selected
        if (state.filters.propertyId) {
            filtered = filtered.filter(e => {
                // Handle both property_id formats
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
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            } else {
                // Map other statuses
                if (status.includes('paid') || status === 'completed') {
                    counts.paid++;
                } else if (status.includes('overdue') || status === 'late') {
                    counts.overdue++;
                } else {
                    counts.pending++;
                }
            }
        });

        return counts;
    },

    getOccupancyData() {
        // If filtering by specific property, use that property's data
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

        // For all properties, aggregate the data
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
    updateChart(chartName, newData) {
        if (!state.charts[chartName]) return;
        
        const chart = state.charts[chartName];
        chart.data.labels = newData.labels;
        
        if (Array.isArray(newData.data)) {
            chart.data.datasets[0].data = newData.data;
        } else if (newData.datasets) {
            chart.data.datasets = newData.datasets;
        }
        
        chart.update('none');
    },

    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const data = dataQueries.getAggregatedRevenue();

        if (state.charts.revenue) {
            this.updateChart('revenue', data);
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
    },

    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;

        const data = dataQueries.getExpensesByCategory();

        if (state.charts.expense) {
            const chart = state.charts.expense;
            chart.data.labels = data.labels;
            chart.data.datasets[0].data = data.data;
            chart.update('none');
            return;
        }

        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#a29bfe', '#fd79a8', '#95e1d3'];

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
    },

    createPaymentStatusChart() {
        const ctx = document.getElementById('paymentStatusChart');
        if (!ctx) return;

        const counts = dataQueries.getPaymentStatusCounts();

        if (state.charts.payment) {
            const chart = state.charts.payment;
            chart.data.datasets[0].data = [counts.paid, counts.pending, counts.overdue];
            chart.update('none');
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
    },

    createOccupancyChart() {
        const ctx = document.getElementById('occupancyChart');
        if (!ctx) return;

        const occupancy = dataQueries.getOccupancyData();

        if (state.charts.occupancy) {
            const chart = state.charts.occupancy;
            chart.data.datasets[0].data = [occupancy.occupied, occupancy.vacant];
            chart.update('none');
            return;
        }

        state.charts.occupancy = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Occupied', 'Vacant'],
                datasets: [{
                    data: [occupancy.occupied, occupancy.vacant],
                    backgroundColor: ['#667eea', '#e0e0e0']
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
    },

    updateAll() {
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
        const profitMargin = totalRevenue > 0 
            ? ((netProfit / totalRevenue) * 100).toFixed(1) 
            : 0;

        // Update DOM elements
        this.updateElement('totalRevenue', utils.formatCurrency(totalRevenue));
        this.updateElement('totalExpenses', utils.formatCurrency(totalExpenses));
        this.updateElement('netProfit', utils.formatCurrency(netProfit));
        this.updateElement('profitMargin', `${profitMargin}%`);
        
        // Update property and tenant counts
        let propertyCount = state.rawData.properties.length;
        let tenantCount = state.rawData.tenants.filter(t => t.status === 'active').length;

        // If filtering by property, show filtered counts
        if (state.filters.propertyId) {
            propertyCount = 1;
            tenantCount = state.rawData.tenants.filter(t => {
                const tenantPropId = t.property_id || t.propertyId;
                return t.status === 'active' && tenantPropId == state.filters.propertyId;
            }).length;
        }

        this.updateElement('totalProperties', propertyCount);
        this.updateElement('activeTenants', tenantCount);
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
            .slice(0, 20); // Show last 20

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">No transactions found</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(payment => {
            // Handle both id formats
            const tenantId = payment.tenant_id || payment.tenantId;
            const propertyId = payment.property_id || payment.propertyId;
            
            const tenant = state.rawData.tenants.find(t => 
                (t.tenant_id || t.id) == tenantId
            );
            const property = state.rawData.properties.find(p => 
                (p.property_id || p.id) == propertyId
            );
            
            const statusClass = payment.status === 'paid' ? 'success' : 
                               payment.status === 'overdue' ? 'danger' : 'warning';
            
            return `
                <tr>
                    <td>${new Date(payment.payment_date).toLocaleDateString()}</td>
                    <td>${tenant ? (tenant.tenant_name || tenant.name) : 'N/A'}</td>
                    <td>${property ? (property.property_name || property.name) : 'N/A'}</td>
                    <td>${payment.payment_method || 'Rent'}</td>
                    <td>${utils.formatCurrency(payment.amount)}</td>
                    <td><span class="badge badge-${statusClass}">${payment.status}</span></td>
                </tr>
            `;
        }).join('');
    }
};

// Event handlers
const eventHandlers = {
    debouncedUpdate: null,

    setupListeners() {
        this.debouncedUpdate = utils.debounce(() => this.updateReport(), 300);

        const elements = {
            reportType: document.getElementById('reportType'),
            startDate: document.getElementById('startDate'),
            endDate: document.getElementById('endDate'),
            property: document.getElementById('property'),
            generateBtn: document.getElementById('generateReportBtn'),
            exportPdfBtn: document.getElementById('exportPdfBtn')
        };

        if (elements.reportType) {
            elements.reportType.addEventListener('change', (e) => {
                state.filters.reportType = e.target.value;
                this.debouncedUpdate();
            });
        }

        if (elements.startDate) {
            elements.startDate.addEventListener('change', (e) => {
                state.filters.startDate = e.target.value;
                this.debouncedUpdate();
            });
        }

        if (elements.endDate) {
            elements.endDate.addEventListener('change', (e) => {
                state.filters.endDate = e.target.value;
                this.debouncedUpdate();
            });
        }

        if (elements.property) {
            elements.property.addEventListener('change', (e) => {
                state.filters.propertyId = e.target.value || null;
                this.debouncedUpdate();
            });
        }

        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', () => this.updateReport());
        }

        if (elements.exportPdfBtn) {
            elements.exportPdfBtn.addEventListener('click', () => this.generatePDF());
        }
    },

    updateReport() {
        utils.showLoading(true);
        try {
            reportCalculations.updateFinancialSummary();
            reportCalculations.updateOccupancyRate();
            reportCalculations.populateTransactionsTable();
            chartManager.updateAll();
        } catch (error) {
            console.error('Update error:', error);
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

        const filename = `SimamiaKodi-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
        const options = {
            margin: 10,
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        utils.showLoading(true);
        html2pdf().set(options).from(element).save()
            .then(() => {
                console.log('PDF generated successfully');
                utils.showLoading(false);
            })
            .catch((error) => {
                console.error('PDF generation error:', error);
                utils.showError('Failed to generate PDF');
                utils.showLoading(false);
            });
    },

    populatePropertyFilter() {
        const propertySelect = document.getElementById('property');
        if (!propertySelect) return;

        // Clear existing options except "All Properties"
        propertySelect.innerHTML = '<option value="">All Properties</option>';

        // Add properties from backend (handle both id and property_id)
        state.rawData.properties.forEach(property => {
            const option = document.createElement('option');
            option.value = property.property_id || property.id;
            option.textContent = property.property_name || property.name;
            propertySelect.appendChild(option);
        });
        
        console.log(`Loaded ${state.rawData.properties.length} properties into dropdown`);
    }
};

// Main app
const app = {
    async initialize() {
        console.log('Initializing SimamiaKodi Reports (Backend Connected)...');
        utils.showLoading(true);

        try {
            // Load data from backend
            const dataLoaded = await apiService.loadAllData();
            
            if (!dataLoaded) {
                throw new Error('Failed to load data from backend');
            }

            // Setup UI
            eventHandlers.setupListeners();
            eventHandlers.populatePropertyFilter();
            
            // Initial report generation
            eventHandlers.updateReport();

            console.log('Reports initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            utils.showError('Failed to initialize reports. Please check your backend connection.');
        } finally {
            utils.showLoading(false);
        }
    },

    async refresh() {
        await apiService.loadAllData();
        eventHandlers.updateReport();
    },

    getStats() {
        return {
            dataLoaded: {
                payments: state.rawData.payments.length,
                expenses: state.rawData.expenses.length,
                properties: state.rawData.properties.length,
                tenants: state.rawData.tenants.length
            },
            filters: state.filters
        };
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Make updateReport and generatePDF globally available for HTML onclick handlers
window.updateReport = () => eventHandlers.updateReport();
window.generatePDF = () => eventHandlers.generatePDF();

// Export for external use
window.SimamiaKodiReports = app;