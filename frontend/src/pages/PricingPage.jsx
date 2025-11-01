import React from 'react';

export default function PricingPage(){
  return (
    <div className="page">
      <h1>Pricing</h1>
      <ul>
        <li>Starter — $49/mo — 250 hydrants, 2 users, PDF reports</li>
        <li>Pro — $149/mo — 1,500 hydrants, 5 users, exports & support</li>
        <li>Enterprise — Contact — unlimited, SSO, custom workflows</li>
      </ul>
      <p>Field services billed separately.</p>
    </div>
  );
}
