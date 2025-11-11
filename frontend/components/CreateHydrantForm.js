// Example: Create Hydrant UI Form (React, connected to org-aware backend)
import React, { useState } from 'react';

export default function CreateHydrantForm({ token }) {
  const [form, setForm] = useState({
    hydrant_number: '',
    latitude: '',
    longitude: '',
    location_address: '',
    manufacturer: '',
    model: '',
    installation_date: '',
    watermain_size_mm: 200,
    static_pressure_psi: ''
  });
  const [message, setMessage] = useState(null);

  const submitHydrant = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/hydrants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    const result = await res.json();
    setMessage(result.message || (result.success ? 'Hydrant created!' : 'Error: ' + result.error));
  };

  return (
    <form onSubmit={submitHydrant}>
      <h2>Add New Hydrant</h2>
      <input placeholder="Hydrant Number" required value={form.hydrant_number} onChange={e=>setForm(f=>({...f,hydrant_number:e.target.value}))} />
      <input placeholder="Latitude" required value={form.latitude} onChange={e=>setForm(f=>({...f,latitude:e.target.value}))} />
      <input placeholder="Longitude" required value={form.longitude} onChange={e=>setForm(f=>({...f,longitude:e.target.value}))} />
      <input placeholder="Address" required value={form.location_address} onChange={e=>setForm(f=>({...f,location_address:e.target.value}))} />
      <input placeholder="Manufacturer" value={form.manufacturer} onChange={e=>setForm(f=>({...f,manufacturer:e.target.value}))} />
      <input placeholder="Model" value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} />
      <input placeholder="Installation Date" type="date" value={form.installation_date} onChange={e=>setForm(f=>({...f,installation_date:e.target.value}))} />
      <input placeholder="Watermain Size (mm)" type="number" value={form.watermain_size_mm} onChange={e=>setForm(f=>({...f,watermain_size_mm:e.target.value}))} />
      <input placeholder="Static Pressure (PSI)" type="number" value={form.static_pressure_psi} onChange={e=>setForm(f=>({...f,static_pressure_psi:e.target.value}))} />
      <button type="submit">Create Hydrant</button>
      {message && <div>{message}</div>}
    </form>
  );
}
