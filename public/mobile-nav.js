// Mobile Navigation JavaScript (public path)
(function(){
  function initMobileNav(){
    if(document.getElementById('mobile-hamburger')) return; // avoid duplicates

    var container = document.createElement('div');
    container.className = 'mobile-nav-container';
    container.innerHTML = '\n      <div class="hamburger" id="mobile-hamburger" aria-label="Toggle menu" aria-expanded="false" role="button" tabindex="0">\n        <div class="bar"></div>\n        <div class="bar"></div>\n        <div class="bar"></div>\n      </div>\n      <ul class="mobile-nav-links" id="mobile-nav-links">\n        <li><a href="/dashboard">Dashboard</a></li>\n        <li><a href="/mapping">Mapping</a></li>\n        <li><a href="/maintenance">Maintenance</a></li>\n        <li><a href="/flow-testing">Flow Testing</a></li>\n        <li><a href="/mobile-app">Mobile App</a></li>\n        <li><a href="/logout">Logout</a></li>\n      </ul>\n    ';

    var header = document.querySelector('header') || document.querySelector('nav') || document.body;
    header.appendChild(container);

    var burger = document.getElementById('mobile-hamburger');
    var links = document.getElementById('mobile-nav-links');

    function toggle(){
      var open = links.classList.contains('open');
      links.classList.toggle('open', !open);
      burger.classList.toggle('open', !open);
      burger.setAttribute('aria-expanded', (!open).toString());
    }

    burger.addEventListener('click', toggle);
    burger.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
    });

    document.addEventListener('click', function(e){
      if(!e.target.closest('.mobile-nav-container')){
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
      }
    });

    window.addEventListener('resize', function(){
      if(window.innerWidth > 768){
        links.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else { initMobileNav(); }
})();