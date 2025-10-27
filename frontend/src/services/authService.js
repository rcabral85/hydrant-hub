import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
      // Token expired or invalid
      localStorage.removeItem('hydrantHub_token');
      localStorage.removeItem('hydrantHub_user');
      
      // Redirect to login if not already there
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

  // Login user
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      return { success: false, error: message };
    }
  }

  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      
      return { success: true, user, token };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      return { success: false, error: message };
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Refresh token
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

  // Get user profile
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      
      // Update stored user data
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to get profile';
      return { success: false, error: message };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      const { user } = response.data;
      
      // Update stored user data
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...user };
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      return { success: false, error: message };
    }
  }

  // Check user role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user is operator or higher
  canOperate() {
    const user = this.getCurrentUser();
    const operatorRoles = ['admin', 'supervisor', 'operator'];
    return user && operatorRoles.includes(user.role);
  }

  // Get organization info
  getOrganization() {
    const user = this.getCurrentUser();
    return user ? {
      id: user.organization_id,
      name: user.organization_name,
      type: user.organization_type
    } : null;
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;

// Also export the configured axios instance for other services
export { api };