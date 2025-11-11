// Example: Inspection Creation Form (React)
import React, { useState } from 'react';

export default function CreateInspectionForm({ token, hydrantId }) {
  const [form, setForm] = useState({
    hydrant_id: hydrantId || '',
    inspection_type_id: '',
    inspection_date: '',
    inspector_name: '',
    inspector_license: '',
    overall_status: 'PASS',
    overall_notes: '',
    compliance_status: 'COMPLIANT',
    photos: []
  });
  const [message, setMessage] = useState(null);

  const submitInspection = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Inspection created!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitInspection}>
      <h2>Create Inspection</h2>
      <input placeholder="Hydrant ID" required value={form.hydrant_id} onChange={e=>setForm(f=>({...f,hydrant_id:e.target.value}))} />
      <input placeholder="Inspection Type ID" required value={form.inspection_type_id} onChange={e=>setForm(f=>({...f,inspection_type_id:e.target.value}))} />
      <input placeholder="Inspection Date" type="datetime-local" required value={form.inspection_date} onChange={e=>setForm(f=>({...f,inspection_date:e.target.value}))} />
      <input placeholder="Inspector Name" required value={form.inspector_name} onChange={e=>setForm(f=>({...f,inspector_name:e.target.value}))} />
      <input placeholder="Inspector License" value={form.inspector_license} onChange={e=>setForm(f=>({...f,inspector_license:e.target.value}))} />
      <select value={form.overall_status} onChange={e=>setForm(f=>({...f,overall_status:e.target.value}))}>
        <option value="PASS">Pass</option>
        <option value="FAIL">Fail</option>
        <option value="CONDITIONAL">Conditional</option>
        <option value="PENDING">Pending</option>
      </select>
      <textarea placeholder="Notes" value={form.overall_notes} onChange={e=>setForm(f=>({...f,overall_notes:e.target.value}))} />
      <select value={form.compliance_status} onChange={e=>setForm(f=>({...f,compliance_status:e.target.value}))}>
        <option value="COMPLIANT">Compliant</option>
        <option value="NON_COMPLIANT">Non-Compliant</option>
        <option value="CONDITIONAL">Conditional</option>
      </select>
      {/* Add file upload/preview for photos if needed */}
      <button type="submit">Create Inspection</button>
      {message && <div>{message}</div>}
    </form>
  );
}
