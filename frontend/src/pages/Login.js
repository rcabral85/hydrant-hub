import React, { useEffect, useState } from 'react';
import { login } from '../services/auth';

export default function Login(){
  const [email, setEmail] = useState('demo@tridentsys.ca');
  const [password, setPassword] = useState('Demo123!');
  const [error, setError] = useState('');

  async function onSubmit(e){
    e.preventDefault(); setError('');
    try { await login(email, password); window.location.href = '/dashboard'; }
    catch (e) { setError(e?.response?.data?.message || 'Login failed'); }
  }

  return (
    <div style={{maxWidth: 380, margin: '80px auto'}}>
      <h2>HydrantHub Login</h2>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{width:'100%',padding:10,margin:'8px 0'}} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{width:'100%',padding:10,margin:'8px 0'}} />
        {error && <div style={{color:'red'}}>{error}</div>}
        <button type="submit" style={{padding:10,width:'100%'}}>Login</button>
      </form>
      <p style={{marginTop:12}}>
        Or try the demo account prefilled above.
      </p>
    </div>
  );
}
