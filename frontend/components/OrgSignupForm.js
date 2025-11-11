// Frontend React example: Organization signup form (to POST to /api/org-signup)
import React, { useState } from 'react';

export default function OrgSignupForm() {
  const [form, setForm] = useState({
    organization_name: '',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: ''
  });
  const [message, setMessage] = useState(null);

  const submitOrgSignup = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/org-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Sign up successful!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitOrgSignup}>
      <h2>Sign Up Your Organization</h2>
      <input placeholder="Organization Name" required value={form.organization_name} onChange={e=>setForm(f=>({...f,organization_name:e.target.value}))} />
      <input placeholder="Admin Email" type="email" required value={form.admin_email} onChange={e=>setForm(f=>({...f,admin_email:e.target.value}))} />
      <input placeholder="Admin First Name" required value={form.admin_first_name} onChange={e=>setForm(f=>({...f,admin_first_name:e.target.value}))} />
      <input placeholder="Admin Last Name" required value={form.admin_last_name} onChange={e=>setForm(f=>({...f,admin_last_name:e.target.value}))} />
      <input placeholder="Admin Password" type="password" required value={form.admin_password} onChange={e=>setForm(f=>({...f,admin_password:e.target.value}))} />
      <button type="submit">Sign Up</button>
      {message && <div>{message}</div>}
    </form>
  );
}
