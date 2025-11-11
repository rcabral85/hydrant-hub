// Frontend: Invite User Form (React, for org admins)
import React, { useState } from 'react';

export default function InviteUserForm({ token }) {
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'operator',
    temp_password: ''
  });
  const [message, setMessage] = useState(null);

  const submitInvite = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Invitation sent!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitInvite}>
      <h2>Invite User</h2>
      <input placeholder="Email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
      <input placeholder="First Name" required value={form.first_name} onChange={e=>setForm(f=>({...f,first_name:e.target.value}))}/>
      <input placeholder="Last Name" required value={form.last_name} onChange={e=>setForm(f=>({...f,last_name:e.target.value}))}/>
      <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
        <option value="operator">Operator</option>
        <option value="supervisor">Supervisor</option>
        <option value="viewer">Viewer</option>
        <option value="fire_inspector">Fire Inspector</option>
      </select>
      <input placeholder="Temporary Password (optional)" value={form.temp_password} onChange={e=>setForm(f=>({...f,temp_password:e.target.value}))}/>
      <button type="submit">Invite</button>
      {message && <div>{message}</div>}
    </form>
  );
}
