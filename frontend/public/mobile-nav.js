// Mobile Navigation JavaScript
(function() {
  'use strict';
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
  
  function initMobileNav() {
    // Only initialize on mobile screens
    if (window.innerWidth >= 600) return;
    
    // Create mobile navigation elements
    createMobileNavElements();
    
    // Set up event listeners
    setupEventListeners();
  }
  
  function createMobileNavElements() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    overlay.id = 'mobile-nav-overlay';
    
    // Create mobile menu
    const menu = document.createElement('div');
    menu.className = 'mobile-nav-menu';
    menu.id = 'mobile-nav-menu';
    
    // Create menu content
    menu.innerHTML = `
      <div class="mobile-nav-header">
        <a href="/dashboard" class="mobile-nav-logo">
          <img src="https://tridentsys.ca/trident-logo.png" alt="Trident Systems" />
          <h2 class="mobile-nav-title">HydrantHub</h2>
        </a>
        <button class="mobile-nav-close" id="mobile-nav-close" aria-label="Close menu">
          &times;
        </button>
      </div>
      
      <ul class="mobile-nav-links">
        <li><a href="/dashboard" data-route="dashboard">Dashboard</a></li>
        <li><a href="/map" data-route="map">Map</a></li>
        <li><a href="/maintenance" data-route="maintenance">Maintenance</a></li>
        <li><a href="/flow-test" data-route="flow-test">Flow Test</a></li>
        <li><a href="/reports" data-route="reports">Reports</a></li>
        <li><a href="https://tridentsys.ca" target="_blank" rel="noopener" class="external">Trident Site</a></li>
      </ul>
      
      <div class="mobile-nav-footer">
        <button class="mobile-nav-logout" id="mobile-nav-logout">Logout</button>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(overlay);
    document.body.appendChild(menu);
    
    // Set active link based on current path
    updateActiveLink();
  }
  
  function setupEventListeners() {
    const hamburger = document.querySelector('[data-testid="MenuIcon"]');
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    const closeButton = document.getElementById('mobile-nav-close');
    const logoutButton = document.getElementById('mobile-nav-logout');
    const navLinks = document.querySelectorAll('.mobile-nav-links a:not(.external)');
    
    // If hamburger doesn't exist, try to find it by MenuIcon component
    const menuIcon = hamburger || document.querySelector('svg[data-testid="MenuIcon"]') || 
                    document.querySelector('.MuiSvgIcon-root');
    
    if (menuIcon) {
      // Find the parent IconButton
      const iconButton = menuIcon.closest('button');
      if (iconButton) {
        iconButton.addEventListener('click', openMenu);
      }
    }
    
    // Close menu events
    if (closeButton) closeButton.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    
    // Logout functionality
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        // Try to trigger React logout
        const logoutBtn = document.querySelector('button:contains("Logout")');
        if (logoutBtn) {
          logoutBtn.click();
        } else {
          // Fallback - redirect to login
          window.location.href = '/login';
        }
        closeMenu();
      });
    }
    
    // Navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        
        // Close menu first
        closeMenu();
        
        // Navigate using React Router if available
        setTimeout(() => {
          if (window.history && window.history.pushState) {
            window.history.pushState(null, null, href);
            // Trigger a popstate event to notify React Router
            window.dispatchEvent(new PopStateEvent('popstate'));
          } else {
            window.location.href = href;
          }
        }, 300);
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeMenu();
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 600) {
        closeMenu();
      }
    });
  }
  
  function openMenu() {
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    
    if (overlay) overlay.classList.add('show');
    if (menu) menu.classList.add('open');
    document.body.classList.add('mobile-nav-open');
    
    // Update active link when opening
    updateActiveLink();
  }
  
  function closeMenu() {
    const overlay = document.getElementById('mobile-nav-overlay');
    const menu = document.getElementById('mobile-nav-menu');
    
    if (overlay) overlay.classList.remove('show');
    if (menu) menu.classList.remove('open');
    document.body.classList.remove('mobile-nav-open');
  }
  
  function updateActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.mobile-nav-links a:not(.external)');
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      const route = link.getAttribute('data-route');
      if (currentPath.startsWith('/' + route) || 
          (route === 'dashboard' && currentPath === '/')) {
        link.classList.add('active');
      }
    });
  }
  
  // Update active link on route changes
  window.addEventListener('popstate', updateActiveLink);
  
  // Fallback for finding logout button
  function findLogoutButton() {
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.toLowerCase().includes('logout')) {
        return button;
      }
    }
    return null;
  }
})();