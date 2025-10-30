import api, { setAuthToken } from '../services/api';

export async function login(email, password){
  const { data } = await api.post('/api/auth/login', { email, password });
  localStorage.setItem('hh_token', data.token);
  setAuthToken(data.token); return data.user;
}

export async function register(email, password, orgName){
  const { data } = await api.post('/api/auth/register', { email, password, orgName });
  localStorage.setItem('hh_token', data.token);
  setAuthToken(data.token); return data.user;
}

export function loadToken(){
  const t = localStorage.getItem('hh_token'); if (t) setAuthToken(t); return t;
}
