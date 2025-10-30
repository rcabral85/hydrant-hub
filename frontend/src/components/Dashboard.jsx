import React, { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Paper, Typography, Stack, Chip, Divider, Alert, Button, IconButton } from '@mui/material';
import { Add, PictureAsPdf } from '@mui/icons-material';
import api from '../services/api';
import dayjs from 'dayjs';
import { generateHydrantSummaryPDF } from '../utils/pdfGenerator';

export default function Dashboard() {
  const [hydrants, setHydrants] = useState([]);
  const [flowTests, setFlowTests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const h = await api.get('/hydrants');
      setHydrants(h.data.hydrants || []);
      const ft = await api.get('/flow-tests');
      setFlowTests(ft.data.flowTests || []);
    } catch (e) {
      setError(e.response?.data || e.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counters = useMemo(() => {
    const total = hydrants.length;
    const active = hydrants.filter(h => (h.status || '').toLowerCase() === 'active').length;
    const outOfService = hydrants.filter(h => (h.status || '').toLowerCase() === 'out_of_service').length;
    const last7 = flowTests.filter(ft => dayjs(ft.test_date).isAfter(dayjs().subtract(7, 'day'))).length;
    const dueSoon = hydrants.filter(h => h.next_test_due && dayjs(h.next_test_due).isBefore(dayjs().add(30, 'day'))).length;
    return { total, active, outOfService, last7, dueSoon };
  }, [hydrants, flowTests]);

  const createDemoTest = async () => {
    setLoading(true);
    try {
      const activeHydrant = hydrants.find(h => (h.status || '').toLowerCase() === 'active');
      if (!activeHydrant) {
        setError('No active hydrants available for demo test');
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
      await loadData(); // Refresh data
      setError(null);
    } catch (e) {
      setError(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    generateHydrantSummaryPDF(hydrants);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">HydrantHub Dashboard</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={createDemoTest}
            disabled={loading}
          >
            Create Demo Flow Test
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            onClick={generatePDF}
            disabled={hydrants.length === 0}
          >
            Export PDF Summary
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Total Hydrants</Typography>
            <Typography variant="h4">{counters.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Active</Typography>
            <Typography variant="h4">{counters.active}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Out of Service</Typography>
            <Typography variant="h4">{counters.outOfService}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Tests (7 days)</Typography>
            <Typography variant="h4">{counters.last7}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Next Tests Due (30 days)</Typography>
        <Divider sx={{ my: 1 }} />
        {hydrants.filter(h => h.next_test_due && dayjs(h.next_test_due).isBefore(dayjs().add(30, 'day'))).length === 0 ? (
          <Typography variant="body2">No tests due in the next 30 days.</Typography>
        ) : (
          <Stack spacing={1}>
            {hydrants
              .filter(h => h.next_test_due && dayjs(h.next_test_due).isBefore(dayjs().add(30, 'day')))
              .map(h => (
                <Stack key={h.id} direction="row" spacing={1} alignItems="center">
                  <Chip label={h.hydrant_number} />
                  <Typography variant="body2">{h.address}</Typography>
                  <Chip label={dayjs(h.next_test_due).format('YYYY-MM-DD')} size="small" />
                </Stack>
              ))}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6">Recent Flow Tests</Typography>
        <Divider sx={{ my: 1 }} />
        {flowTests.length === 0 ? (
          <Typography variant="body2">No flow tests recorded yet.</Typography>
        ) : (
          <Stack spacing={1}>
            {flowTests.slice(0, 5).map(ft => (
              <Stack key={ft.id} direction="row" spacing={1} alignItems="center">
                <Chip label={ft.test_number} />
                <Typography variant="body2">{dayjs(ft.test_date).format('YYYY-MM-DD')}</Typography>
                <Chip label={`${ft.total_flow_gpm} GPM`} />
                <Chip label={`Class ${ft.nfpa_class}`} />
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
