import axios from 'axios';

const RAW = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || window.location.origin;

const BASE = (() => {
  try {
    const u = new URL(RAW, window.location.origin);
    if (!u.pathname.replace(/\/+$/, '').endsWith('/api')) {
      u.pathname = `${u.pathname.replace(/\/+$/, '')}/api`;
    }
    return u.toString().replace(/\/+$/, '');
  } catch {
    const s = (RAW || '').replace(/\/+$/, '');
    return s.endsWith('/api') ? s : `${s}/api`;
  }
})();

const api = axios.create({ baseURL: BASE });

// Add authentication token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hydrantHub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('hydrantHub_token');
      localStorage.removeItem('hydrantHub_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
