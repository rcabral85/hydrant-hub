// Example: Create Work Order Form (React, for org users)
import React, { useState } from 'react';

export default function CreateWorkOrderForm({ token, hydrantId }) {
  const [form, setForm] = useState({
    hydrant_id: hydrantId || '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    target_completion_date: '',
    assigned_to: '',
    category: 'GENERAL',
    status: 'CREATED'
  });
  const [message, setMessage] = useState(null);

  const submitWorkOrder = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/work-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Work order created!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitWorkOrder}>
      <h2>Create Work Order</h2>
      <input placeholder="Hydrant ID" required value={form.hydrant_id} onChange={e=>setForm(f=>({...f,hydrant_id:e.target.value}))} />
      <input placeholder="Title" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
      <textarea placeholder="Description" required value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
      <input placeholder="Assign To" value={form.assigned_to} onChange={e=>setForm(f=>({...f,assigned_to:e.target.value}))} />
      <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <input type="date" placeholder="Target Completion Date" value={form.target_completion_date} onChange={e=>setForm(f=>({...f,target_completion_date:e.target.value}))} />
      <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
        <option value="GENERAL">General</option>
        <option value="VALVE_REPAIR">Valve Repair</option>
        <option value="PAINT_MAINTENANCE">Paint Maintenance</option>
        <option value="CAP_REPLACEMENT">Cap Replacement</option>
        <option value="SAFETY_HAZARD">Safety Hazard</option>
      </select>
      <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
        <option value="CREATED">Created</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button type="submit">Create Work Order</button>
      {message && <div>{message}</div>}
    </form>
  );
}
