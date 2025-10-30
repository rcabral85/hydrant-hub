import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import HydrantMap from './components/HydrantMap';
import FlowTestForm from './components/FlowTestForm';
// Removed TestPage import for production
import './App.css';

const theme = createTheme({
  palette: {
    primary: { main: '#1e3c72', light: '#4a6bb5', dark: '#0a1929' },
    secondary: { main: '#ff6b35', light: '#ff9b6b', dark: '#c53a00' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#2c3e50', secondary: '#5a6c7d' },
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', 
    h1: { fontWeight: 700 }, 
    h2: { fontWeight: 600 }, 
    h3: { fontWeight: 600 }, 
    h4: { fontWeight: 600 }, 
    h5: { fontWeight: 600 }, 
    h6: { fontWeight: 600 } 
  },
  shape: { borderRadius: 8 },
});

// SEO Title Updates
function TitleUpdater() {
  const location = useLocation();
  
  useEffect(() => {
    const routeTitles = {
      '/login': 'Login',
      '/dashboard': 'Dashboard',
      '/map': 'Hydrant Map',
      '/flow-test': 'Flow Test Form',
      '/reports': 'Reports'
    };
    
    const currentTitle = routeTitles[location.pathname] || 'Dashboard';
    if (window.updatePageTitle) {
      window.updatePageTitle(currentTitle);
    } else {
      document.title = `${currentTitle} - HydrantHub | Trident Systems`;
    }
  }, [location.pathname]);
  
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><HydrantMap /></ProtectedRoute>} />
      <Route path="/flow-test" element={<ProtectedRoute><FlowTestForm /></ProtectedRoute>} />
      <Route path="/flow-test/:hydrantId" element={<ProtectedRoute><FlowTestForm /></ProtectedRoute>} />
      
      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* 404 Catch-all - Redirect to dashboard if authenticated, login if not */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh' 
          }}>
            <TitleUpdater />
            <Navigation />
            
            <Box component="main" sx={{ flexGrow: 1 }}>
              <AppRoutes />
            </Box>
            
            <Footer />
            
            <ToastContainer 
              position="top-right" 
              autoClose={5000} 
              hideProgressBar={false} 
              newestOnTop={false} 
              closeOnClick 
              rtl={false} 
              pauseOnFocusLoss 
              draggable 
              pauseOnHover 
              theme="light" 
              toastStyle={{ fontFamily: theme.typography.fontFamily }} 
            />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;