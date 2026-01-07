     document.body.insertAdjacentHTML('afterbegin', navHTML);
    initializeMobileNav();


function toggleMobileSidebar() {
    const hamburger = document.querySelector('.mobile-hamburger');
    const sidebar = document.getElementById('mobileSidebar');
    const overlay = document.getElementById('mobileOverlay');

    hamburger.classList.toggle('active');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');

    // Prevent body scroll when menu is open
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function handleMobileLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/pages/auth/login.html';
    }
}

function setActiveMobileLink() {
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.mobile-menu-link');
    
    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

function loadMobileUserInfo() {
    try {
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            const fullName = userData.full_name || userData.username || 'User';
            const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            
            // Top nav icon
            const topIcon = document.getElementById('mobileUserIcon');
            if (topIcon) topIcon.textContent = initials;
            
            // Sidebar
            const sidebarAvatar = document.getElementById('mobileSidebarAvatar');
            if (sidebarAvatar) sidebarAvatar.textContent = initials;
            
            const sidebarName = document.getElementById('mobileSidebarName');
            if (sidebarName) sidebarName.textContent = fullName;
            
            const sidebarRole = document.getElementById('mobileSidebarRole');
            if (sidebarRole) sidebarRole.textContent = userData.role || 'User';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

function initializeMobileNav() {
    setActiveMobileLink();
    loadMobileUserInfo();
    
    // Close menu when clicking a link
    document.querySelectorAll('.mobile-menu-link').forEach(link => {
        link.addEventListener('click', () => {
            toggleMobileSidebar();
        });
    });

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                // Close mobile menu on desktop
                const sidebar = document.getElementById('mobileSidebar');
                const overlay = document.getElementById('mobileOverlay');
                const hamburger = document.querySelector('.mobile-hamburger');
                
                if (sidebar) sidebar.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 250);
    });
}

// Auto-initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createResponsiveNavigation);
} else {
    createResponsiveNavigation();
}

