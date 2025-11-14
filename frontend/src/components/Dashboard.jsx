import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Chip, Divider, Alert, Button, CircularProgress } from '@mui/material';
import { Add, PictureAsPdf, TrendingUp, CheckCircle, Warning } from '@mui/icons-material';
import api from '../services/api';
import dayjs from 'dayjs';
import { generateHydrantSummaryPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [hydrants, setHydrants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.is_superadmin;

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch real-time metrics from backend
      const metricsResponse = await api.get('/dashboard/metrics');
      setMetrics(metricsResponse.data);
      
      // Fetch hydrants for additional details
      const hydrantsResponse = await api.get('/hydrants');
      setHydrants(hydrantsResponse.data.hydrants || []);
      
      setError(null);
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError(e.response?.data?.error || e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createDemoTest = async () => {
    setLoading(true);
    try {
      const activeHydrant = hydrants.find(h => (h.status || '').toLowerCase() === 'active');
      if (!activeHydrant) {
        setError('No active hydrants available for demo test');
        setLoading(false);
        return;
      }

      const payload = {
        hydrant_id: activeHydrant.id,
        test_date: dayjs().format('YYYY-MM-DD'),
        static_pressure_psi: 65,
        residual_pressure_psi: 45,
        outlets: [
          { size: 2.5, pitotPressure: 42, coefficient: 0.9 },
          { size: 2.5, pitotPressure: 38, coefficient: 0.9 }
        ],
        weather_conditions: 'Clear',
        temperature_f: 72,
        notes: 'Demo flow test created from dashboard'
      };

      await api.post('/flow-tests', payload);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    generateHydrantSummaryPDF(hydrants);
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">HydrantHub Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin ? 'Administrator View' : 'Operator View'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={createDemoTest}
              disabled={loading || hydrants.length === 0}
            >
              Create Demo Test
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={generatePDF}
            disabled={hydrants.length === 0}
          >
            Export PDF
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="subtitle2">Total Hydrants</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {metrics?.hydrants?.total || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <Typography variant="subtitle2">Active Hydrants</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {metrics?.hydrants?.active || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Typography variant="subtitle2">Flow Tests (7 days)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {metrics?.flow_tests?.last_7_days || 0}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <Typography variant="subtitle2">Tests Due (30 days)</Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
              {metrics?.hydrants?.due_for_testing || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* NFPA Classification Distribution */}
      {metrics?.nfpa_distribution && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp /> NFPA Flow Classification
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(metrics.nfpa_distribution).map(([nfpaClass, count]) => (
              <Grid item xs={6} sm={3} key={nfpaClass}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography variant="h4" color="primary">{count}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class {nfpaClass || 'Unclassified'}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Admin-Only Metrics */}
      {isAdmin && metrics?.work_orders && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Work Order Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {metrics.work_orders.pending || 0}
                </Typography>
                <Typography variant="body2">Pending</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {metrics.work_orders.in_progress || 0}
                </Typography>
                <Typography variant="body2">In Progress</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {metrics.work_orders.completed || 0}
                </Typography>
                <Typography variant="body2">Completed</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Compliance Status */}
      {metrics?.compliance && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle /> Compliance Overview
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">Tested Within 12 Months</Typography>
                <Typography variant="h6" color="success.main">
                  {metrics.compliance.percentage_tested || 0}%
                </Typography>
              </Stack>
              <Box sx={{ bgcolor: 'grey.200', height: 8, borderRadius: 1, mt: 1 }}>
                <Box 
                  sx={{ 
                    bgcolor: 'success.main', 
                    height: '100%', 
                    width: `${metrics.compliance.percentage_tested || 0}%`,
                    borderRadius: 1
                  }} 
                />
              </Box>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Recent Activity */}
      {hydrants.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Hydrants</Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {hydrants.slice(0, 5).map(h => (
              <Stack key={h.id} direction="row" spacing={2} alignItems="center">
                <Chip label={h.hydrant_number} color="primary" />
                <Typography variant="body2" sx={{ flex: 1 }}>{h.address || 'No address'}</Typography>
                {h.nfpa_class && <Chip label={`Class ${h.nfpa_class}`} size="small" />}
                <Chip 
                  label={h.status || 'unknown'} 
                  size="small" 
                  color={h.status === 'active' ? 'success' : 'warning'}
                />
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {hydrants.length === 0 && !loading && (
        <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Warning sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>No Hydrants Found</Typography>
          <Typography variant="body2" color="text.secondary">
            Start by adding hydrants to your organization
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
