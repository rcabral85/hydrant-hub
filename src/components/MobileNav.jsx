// React MobileNav component for hydrant-management frontend
import React, { useState } from "react";

function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="mobile-nav">
      <div className="hamburger" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={menuOpen} tabIndex={0} onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMenu();
        }
      }}>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
        <div className={`bar ${menuOpen ? "open" : ""}`}></div>
      </div>
      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>  
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/mapping">Mapping</a></li>
        <li><a href="/maintenance">Maintenance</a></li>
        <li><a href="/flow-testing">Flow Testing</a></li>
        <li><a href="/mobile-app">Mobile App</a></li>
        <li><a href="/logout">Logout</a></li>
      </ul>

      <style jsx>{`
        .mobile-nav {
          position: relative;
          background: #10B981;
          padding: 10px 20px;
        }
        .hamburger {
          cursor: pointer;
          width: 30px;
          height: 21px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .bar {
          height: 3px;
          background: white;
          border-radius: 2px;
          transition: 0.3s ease;
        }
        .bar.open:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .bar.open:nth-child(2) {
          opacity: 0;
        }
        .bar.open:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
        .nav-links {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
          display: none;
          flex-direction: column;
          background: #059669;
          border-radius: 6px;
        }
        .nav-links.open {
          display: flex;
        }
        .nav-links li {
          margin: 10px 0;
        }
        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: bold;
          padding: 10px 15px;
          display: block;
        }
        .nav-links a:hover,
        .nav-links a:focus {
          background: #034d3c;
          outline: none;
        }
      `}</style>
    </nav>
  );
}

export default MobileNav;
