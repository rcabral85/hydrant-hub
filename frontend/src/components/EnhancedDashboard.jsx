import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  LocalFireDepartment as HydrantIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function EnhancedDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem('hydrantHub_token');

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/dashboard/stats?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Dashboard metrics:', response.data);
        setMetrics(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const isAdmin = user?.role === 'admin';
  const isSuperadmin = user?.is_superadmin === true;

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          HydrantHub Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Complete hydrant management & regulatory compliance platform
        </Typography>
        {(isAdmin || isSuperadmin) && (
          <Chip
            label="Administrator View"
            color="primary"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Hydrants */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HydrantIcon sx={{ mr: 1 }} />
                <Typography variant="h4" fontWeight={700}>
                  {metrics?.hydrants?.total || 0}
                </Typography>
              </Box>
              <Typography variant="body2">Total Hydrants</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance Rate */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckIcon sx={{ mr: 1 }} />
                <Typography variant="h4" fontWeight={700}>
                  {metrics?.compliance?.percentage || 0}%
                </Typography>
              </Box>
              <Typography variant="body2">Compliance Rate</Typography>
              <Typography variant="caption">O. Reg 169/03</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Overdue Tests */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: metrics?.hydrants?.testOverdue > 0 ? 'warning.main' : 'success.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <WarningIcon sx={{ mr: 1 }} />
                <Typography variant="h4" fontWeight={700}>
                  {metrics?.hydrants?.testOverdue || 0}
                </Typography>
              </Box>
              <Typography variant="body2">Overdue Inspections</Typography>
              <Typography variant="caption">
                {metrics?.hydrants?.testOverdue > 0 ? 'Immediate attention' : 'All up to date'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Hydrants */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BuildIcon sx={{ mr: 1 }} />
                <Typography variant="h4" fontWeight={700}>
                  {metrics?.hydrants?.active || 0}
                </Typography>
              </Box>
              <Typography variant="body2">Active Hydrants</Typography>
              <Typography variant="caption">Operational status</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* NFPA Classification */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          NFPA 291 Classification Distribution
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {metrics?.nfpaClasses?.['AA'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class AA (1500+ GPM)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {metrics?.nfpaClasses?.['A'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class A (1000-1499 GPM)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {metrics?.nfpaClasses?.['B'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class B (500-999 GPM)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
              <Typography variant="h5" fontWeight={700}>
                {metrics?.nfpaClasses?.['C'] || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class C (&lt;500 GPM)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Activity Summary */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Activity (Last 30 Days)
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {metrics?.maintenance?.inspections || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inspections Completed
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {metrics?.flowTests?.last30Days || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Flow Tests Conducted
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {metrics?.hydrants?.total - (metrics?.hydrants?.testOverdue || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hydrants Up to Date
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default EnhancedDashboard;