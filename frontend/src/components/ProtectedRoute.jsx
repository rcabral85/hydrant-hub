// Frontend Protected Route Component
// File: frontend/src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requireSuperadmin = false, requireAdmin = false }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for superadmin access
  if (requireSuperadmin && !user?.is_superadmin) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        p={3}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            textAlign: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You do not have permission to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Superadmin privileges required.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            sx={{ mt: 3 }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  // Check for admin access (includes superadmins)
  if (requireAdmin && user?.role !== 'admin' && !user?.is_superadmin) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        p={3}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            maxWidth: 500, 
            textAlign: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h4" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You do not have permission to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Administrator privileges required.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/dashboard')} 
            sx={{ mt: 3 }}
          >
            Return to Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
