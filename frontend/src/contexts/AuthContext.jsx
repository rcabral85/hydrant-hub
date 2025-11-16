import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER: 'LOAD_USER',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload.user },
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on initial mount
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from localStorage
  const loadUser = async () => {
    try {
      const user = authService.getCurrentUser();
      const token = authService.getToken();
      
      if (user && token) {
        // Verify token is still valid by fetching fresh user data
        const result = await authService.getProfile();
        if (result.success) {
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: { user: result.user },
          });
        } else {
          // Token is invalid, logout
          authService.logout();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER,
          payload: { user: null },
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER,
        payload: { user: null },
      });
    }
  };

  // Login function
  const login = async (username, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await authService.login(username, password);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });
        
        toast.success(`Welcome back, ${result.user.first_name}!`);
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error },
        });
        
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const result = await authService.register(userData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });
        
        toast.success('Registration successful! Welcome to HydrantHub.');
        return { success: true };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: { error: result.error },
        });
        
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage },
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

 const logout = async () => {
  try {
    // Nuclear option - clear EVERYTHING
    localStorage.clear();
    sessionStorage.clear();
    
    // Dispatch logout to clear React state
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Force complete reload to login page
    window.location.replace('/login');
  } catch (error) {
    console.error('Logout error:', error);
    window.location.replace('/login');
  }
};


  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const result = await authService.updateProfile(profileData);
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });
        
        toast.success('Profile updated successfully!');
        return { success: true };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = 'Profile update failed.';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const result = await authService.refreshToken();
      
      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { user: result.user },
        });
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      logout();
      return false;
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Helper functions
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const isAdmin = () => {
    return hasRole('admin');
  };

  const canOperate = () => {
    const operatorRoles = ['admin', 'supervisor', 'operator'];
    return state.user && operatorRoles.includes(state.user.role);
  };

  const getOrganization = () => {
    return state.user ? {
      id: state.user.organization_id,
      name: state.user.organization_name,
      type: state.user.organization_type
    } : null;
  };

  // Context value
  const value = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    clearError,
    loadUser,
    
    // Helpers
    hasRole,
    isAdmin,
    canOperate,
    getOrganization,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
