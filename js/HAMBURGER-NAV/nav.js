/**
 * Mobile Navigation System
 * Responsive hamburger menu with user info and logout
 */

// Navigation Configuration
const MobileNav = {
    config: {
        breakpoint: 768,
        animationDuration: 300,
        autoCloseDelay: 250
    },
    
    state: {
        isOpen: false,
        isInitialized: false
    },

    /**
     * Initialize mobile navigation
     */
    init() {
        if (this.state.isInitialized) {
            console.warn('⚠️ Mobile navigation already initialized');
            return;
        }

        console.log('📱 Initializing mobile navigation...');
        
        this.createNavigationHTML();
        this.setupEventListeners();
        this.setActiveLink();
        this.loadUserInfo();
        
        this.state.isInitialized = true;
        console.log('✅ Mobile navigation initialized');
    },

    /**
     * Create navigation HTML structure
     */
    createNavigationHTML() {
        const environment = typeof API_CONFIG !== 'undefined' ? API_CONFIG.ENVIRONMENT : 'Production';
        
        const navHTML = `
            <div class="mobile-top-nav" id="mobileTopNav">
                <button class="mobile-hamburger" onclick="MobileNav.toggle()" aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                
                <div class="mobile-logo">
                    <i class="fas fa-building"></i>
                    <span>SimamiaKodi</span>
                </div>
                
                <div class="mobile-user-icon" id="mobileUserIcon">
                    <i class="fas fa-user"></i>
                </div>
            </div>

            <div class="mobile-sidebar" id="mobileSidebar">
                <div class="mobile-user-profile">
                    <div class="mobile-avatar" id="mobileSidebarAvatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-name" id="mobileSidebarName">Loading...</div>
                        <div class="mobile-user-role" id="mobileSidebarRole">User</div>
                    </div>
                </div>

                <nav class="mobile-menu">
                    <a href="/dashboard.html" class="mobile-menu-link">
                        <i class="fas fa-home"></i>
                        <span>Dashboard</span>
                    </a>
                    
                    <a href="/pages/tenants/list.html" class="mobile-menu-link">
                        <i class="fas fa-users"></i>
                        <span>Tenants</span>
                    </a>
                    
                    <a href="/pages/properties/list.html" class="mobile-menu-link">
                        <i class="fas fa-building"></i>
                        <span>Properties</span>
                    </a>
                    
                    <a href="/pages/units/list.html" class="mobile-menu-link">
                        <i class="fas fa-door-open"></i>
                        <span>Units</span>
                    </a>
                    
                    <a href="/pages/payments/list.html" class="mobile-menu-link">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Payments</span>
                    </a>
                    
                    <a href="/pages/expenses/expenses.html" class="mobile-menu-link">
                        <i class="fas fa-receipt"></i>
                        <span>Expenses</span>
                    </a>
                    
                    <a href="/pages/maintenance.html" class="mobile-menu-link">
                        <i class="fas fa-tools"></i>
                        <span>Maintenance</span>
                    </a>
                    
                    <a href="/pages/utilities/utilities.html" class="mobile-menu-link">
                        <i class="fas fa-bolt"></i>
                        <span>Utilities</span>
                    </a>
                    
                    <a href="/pages/agent/agent.html" class="mobile-menu-link">
                        <i class="fas fa-user-tie"></i>
                        <span>Agents</span>
                    </a>
                    
                    <a href="/pages/caretaker/caretaker.html" class="mobile-menu-link">
                        <i class="fas fa-user-shield"></i>
                        <span>Caretakers</span>
                    </a>
                    
                    <a href="/pages/reports/analytics.html" class="mobile-menu-link">
                        <i class="fas fa-chart-bar"></i>
                        <span>Reports</span>
                    </a>
                </nav>

                <div class="mobile-menu-footer">
                    <button class="mobile-menu-link mobile-logout-btn" onclick="MobileNav.handleLogout()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                    
                    <div class="mobile-version-info">
                        <small>Environment: ${environment}</small>
                    </div>
                </div>
            </div>

            <div class="mobile-overlay" id="mobileOverlay" onclick="MobileNav.close()"></div>
        `;

        document.body.insertAdjacentHTML('afterbegin', navHTML);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.querySelectorAll('.mobile-menu-link').forEach(link => {
            if (!link.classList.contains('mobile-logout-btn')) {
                link.addEventListener('click', () => {
                    this.close();
                });
            }
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > this.config.breakpoint && this.state.isOpen) {
                    this.close();
                }
            }, this.config.autoCloseDelay);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isOpen) {
                this.close();
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.state.isOpen && !e.target.closest('.mobile-sidebar')) {
                e.preventDefault();
            }
        }, { passive: false });
    },

    /**
     * Toggle sidebar
     */
    toggle() {
        this.state.isOpen ? this.close() : this.open();
    },

    /**
     * Open sidebar
     */
    open() {
        console.log('📱 Opening mobile menu');
        
        const hamburger = document.querySelector('.mobile-hamburger');
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (hamburger) hamburger.classList.add('active');
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        
        document.body.style.overflow = 'hidden';
        this.state.isOpen = true;
    },

    /**
     * Close sidebar
     */
    close() {
        console.log('📱 Closing mobile menu');
        
        const hamburger = document.querySelector('.mobile-hamburger');
        const sidebar = document.getElementById('mobileSidebar');
        const overlay = document.getElementById('mobileOverlay');

        if (hamburger) hamburger.classList.remove('active');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        
        document.body.style.overflow = '';
        this.state.isOpen = false;
    },

    /**
     * Set active link based on current page
     */
    setActiveLink() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.mobile-menu-link');
        
        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === currentPath || 
                (currentPath === '/' && href === '/dashboard.html') ||
                (currentPath.includes(href) && href !== '/')) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Load user information
     */
    loadUserInfo() {
        try {
            const userDataStr = localStorage.getItem('user_data');
            
            if (!userDataStr) {
                console.warn('⚠️ No user data found');
                this.setDefaultUserInfo();
                return;
            }

            const userData = JSON.parse(userDataStr);
            const fullName = userData.full_name || userData.fullName || userData.username || 'User';
            const initials = this.generateInitials(fullName);
            const role = userData.role || 'User';

            const topIcon = document.getElementById('mobileUserIcon');
            if (topIcon) {
                topIcon.textContent = initials;
                topIcon.style.background = this.generateColorFromName(fullName);
            }

            const sidebarAvatar = document.getElementById('mobileSidebarAvatar');
            if (sidebarAvatar) {
                sidebarAvatar.textContent = initials;
                sidebarAvatar.style.background = this.generateColorFromName(fullName);
            }

            const sidebarName = document.getElementById('mobileSidebarName');
            if (sidebarName) sidebarName.textContent = fullName;

            const sidebarRole = document.getElementById('mobileSidebarRole');
            if (sidebarRole) sidebarRole.textContent = role;

            console.log('✅ User info loaded:', fullName);

        } catch (error) {
            console.error('❌ Error loading user info:', error);
            this.setDefaultUserInfo();
        }
    },

    /**
     * Set default user info (fallback)
     */
    setDefaultUserInfo() {
        const topIcon = document.getElementById('mobileUserIcon');
        if (topIcon) topIcon.innerHTML = '<i class="fas fa-user"></i>';

        const sidebarAvatar = document.getElementById('mobileSidebarAvatar');
        if (sidebarAvatar) sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';

        const sidebarName = document.getElementById('mobileSidebarName');
        if (sidebarName) sidebarName.textContent = 'Guest User';

        const sidebarRole = document.getElementById('mobileSidebarRole');
        if (sidebarRole) sidebarRole.textContent = 'Guest';
    },

    /**
     * Generate initials from name
     */
    generateInitials(name) {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    /**
     * Generate color from name (for avatar background)
     */
    generateColorFromName(name) {
        const colors = [
            '#198754', '#0d6efd', '#6f42c1', '#d63384', 
            '#fd7e14', '#20c997', '#0dcaf0', '#6610f2'
        ];
        return colors[name.length % colors.length];
    },

    /**
     * Handle logout
     */
    async handleLogout() {
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }

        console.log('🔓 Logging out...');

        try {
            if (typeof ApiService !== 'undefined' && typeof API_CONFIG !== 'undefined') {
                try {
                    await ApiService.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
                } catch (error) {
                    console.warn('⚠️ Logout API call failed:', error);
                }
            }

            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user_data');
            localStorage.removeItem('remember_me');

            console.log('✅ Logged out successfully');

            window.location.href = '/pages/auth/login.html';

        } catch (error) {
            console.error('❌ Logout error:', error);
            window.location.href = '/pages/auth/login.html';
        }
    },

    /**
     * Refresh user info (call after profile update)
     */
    refresh() {
        console.log('🔄 Refreshing mobile navigation...');
        this.setActiveLink();
        this.loadUserInfo();
    }
};

/**
 * Auto-initialize when DOM is ready
 */
function initializeMobileNavigation() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileNav.init());
    } else {
        MobileNav.init();
    }
}

initializeMobileNavigation();

window.MobileNav = MobileNav;
window.toggleMobileSidebar = () => MobileNav.toggle();
window.handleMobileLogout = () => MobileNav.handleLogout();