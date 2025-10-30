import api from '../services/api';

export async function listHydrants(){ const { data } = await api.get('/api/hydrants'); return data; }
export async function createHydrant(payload){ const { data } = await api.post('/api/hydrants', payload); return data; }
export async function listTests(){ const { data } = await api.get('/api/tests'); return data; }
export async function createTest(payload){ const { data } = await api.post('/api/tests', payload); return data; }
