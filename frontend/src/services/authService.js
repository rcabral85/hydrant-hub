import axios from 'axios';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || window.location.origin;
// Ensure exactly one /api prefix
const API_BASE_URL = (() => {
  try {
    const u = new URL(RAW_BASE, window.location.origin);
    // If path already starts with /api, leave it; otherwise add it
    if (!u.pathname.replace(/\/+$/, '').endsWith('/api')) {
      u.pathname = `${u.pathname.replace(/\/+$/, '')}/api`;
    }
    return u.toString().replace(/\/+$/, '');
  } catch {
    // Fallback for plain strings
    const s = (RAW_BASE || '').replace(/\/+$/, '');
    return s.endsWith('/api') ? s : `${s}/api`;
  }
})();

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hydrantHub_token');
      localStorage.removeItem('hydrantHub_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'hydrantHub_token';
    this.USER_KEY = 'hydrantHub_user';
    this.api = api;
  }

  // Login user (identifier = username or email)
  async login(identifier, password) {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  }

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh');
      const { token, user } = response.data;
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return { success: true, user, token };
    } catch (error) {
      this.logout();
      return { success: false, error: 'Token refresh failed' };
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get profile';
      return { success: false, error: message };
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      const { user } = response.data;
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...user };
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      return { success: false, error: message };
    }
  }

  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  canOperate() {
    const user = this.getCurrentUser();
    const operatorRoles = ['admin', 'supervisor', 'operator'];
    return user && operatorRoles.includes(user.role);
  }

  getOrganization() {
    const user = this.getCurrentUser();
    return user ? {
      id: user.organization_id,
      name: user.organization_name,
      type: user.organization_type
    } : null;
  }
}

const authService = new AuthService();
export default authService;
export { api };