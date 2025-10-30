import React, { useEffect, useState } from 'react';
import { listHydrants, listTests } from '../services/data';

export default function Dashboard(){
  const [hydrants, setHydrants] = useState([]);
  const [tests, setTests] = useState([]);
  useEffect(()=>{ (async()=>{ setHydrants(await listHydrants()); setTests(await listTests()); })(); },[]);
  return (
    <div style={{padding: 16}}>
      <h2>Dashboard</h2>
      <div style={{display:'flex', gap: 24}}>
        <div>
          <h3>Hydrants</h3>
          <ul>
            {hydrants.map(h=> <li key={h.id}>{h.asset_id} — {h.street}, {h.city}</li>)}
          </ul>
        </div>
        <div>
          <h3>Recent Flow Tests</h3>
          <ul>
            {tests.map(t=> <li key={t.id}>Hydrant #{t.hydrant_id} — {Math.round(t.flow_at_20psi_gpm)} GPM ({t.nfpa_class})</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}
