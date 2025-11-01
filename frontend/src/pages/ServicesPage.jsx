import React from 'react';
import { Link } from 'react-router-dom';

export default function ServicesPage(){
  return (
    <div className="page">
      <h1>Services</h1>
      <ul>
        <li><Link to="/services/fire-flow-testing">Fire Flow Testing</Link></li>
        <li>Hydrant Maintenance & Inspections</li>
        <li>Annual Reporting Packages</li>
      </ul>
    </div>
  );
}
