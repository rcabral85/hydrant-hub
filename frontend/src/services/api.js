import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const listHydrants = async ({ q = '', nfpa_class = '', status = '', page = 1, limit = 100 } = {}) => {
  const params = {};
  if (q) params.q = q;
  if (nfpa_class) params.nfpa_class = nfpa_class;
  if (status) params.status = status;
  params.page = page;
  params.limit = limit;
  const res = await api.get('/hydrants', { params });
  return res.data;
};

export const createHydrant = async (payload) => {
  const res = await api.post('/hydrants', payload);
  return res.data;
};

export const updateHydrant = async (id, payload) => {
  const res = await api.put(`/hydrants/${id}`, payload);
  return res.data;
};

export const deleteHydrant = async (id) => {
  const res = await api.delete(`/hydrants/${id}`);
  return res.data;
};

export default api;
