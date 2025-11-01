import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="ts-header">
      <div className="ts-header__inner">
        <Link to="/" className="ts-logo">Trident Systems</Link>
        <nav className="ts-nav">
          <NavLink to="/hydranthub" className={({isActive}) => isActive ? 'active' : ''}>HydrantHub</NavLink>
          <NavLink to="/features" className={({isActive}) => isActive ? 'active' : ''}>Features</NavLink>
          <NavLink to="/pricing" className={({isActive}) => isActive ? 'active' : ''}>Pricing</NavLink>
          <NavLink to="/services" className={({isActive}) => isActive ? 'active' : ''}>Services</NavLink>
          <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : ''}>Contact</NavLink>
          <a href="https://app.tridentsys.ca" className="login-link" rel="noopener">Login</a>
        </nav>
      </div>
    </header>
  );
}
