// Mobile Navigation JavaScript
// Add this script to your main HTML file or include it as a separate JS file

function initMobileNav() {
  // Create hamburger menu HTML
  const hamburgerHTML = `
    <div class="mobile-nav-container">
      <div class="hamburger" id="mobile-hamburger" aria-label="Toggle menu" aria-expanded="false" role="button" tabindex="0">
        <div class="bar"></div>
        <div class="bar"></div>
        <div class="bar"></div>
      </div>
      <ul class="mobile-nav-links" id="mobile-nav-links">
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/mapping">Mapping</a></li>
        <li><a href="/maintenance">Maintenance</a></li>
        <li><a href="/flow-testing">Flow Testing</a></li>
        <li><a href="/mobile-app">Mobile App</a></li>
        <li><a href="/logout">Logout</a></li>
      </ul>
    </div>
  `;

  // Find existing navigation or header and add hamburger menu
  const header = document.querySelector('header') || document.querySelector('nav') || document.body;
  const mobileNavContainer = document.createElement('div');
  mobileNavContainer.innerHTML = hamburgerHTML;
  header.appendChild(mobileNavContainer.firstElementChild);

  // Get elements
  const hamburger = document.getElementById('mobile-hamburger');
  const navLinks = document.getElementById('mobile-nav-links');

  // Toggle function
  function toggleMenu() {
    const isOpen = navLinks.classList.contains('open');
    
    if (isOpen) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    } else {
      navLinks.classList.add('open');
      hamburger.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
  }

  // Event listeners
  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mobile-nav-container')) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu when window resizes to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initMobileNav };
}