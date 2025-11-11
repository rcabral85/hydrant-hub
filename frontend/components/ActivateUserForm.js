// React: Activate User Form (frontend, for invited users)
import React, { useState } from 'react';

export default function ActivateUserForm() {
  const [form, setForm] = useState({ email: '', temp_password: '', new_password: '' });
  const [message, setMessage] = useState(null);

  const submitActivate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/activate-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Activation successful!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitActivate}>
      <h2>Activate Your Account</h2>
      <input placeholder="Email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
      <input placeholder="Temporary Password" type="password" required value={form.temp_password} onChange={e=>setForm(f=>({...f,temp_password:e.target.value}))} />
      <input placeholder="New Password" type="password" required value={form.new_password} onChange={e=>setForm(f=>({...f,new_password:e.target.value}))} />
      <button type="submit">Activate</button>
      {message && <div>{message}</div>}
    </form>
  );
}
