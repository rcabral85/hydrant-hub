import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, IconButton, Alert, Chip } from '@mui/material';
import { AddCircle, RemoveCircle, PictureAsPdf } from '@mui/icons-material';
import api, { listHydrants } from '../services/api';
import dayjs from 'dayjs';
import { generateFlowTestPDF } from '../utils/pdfGenerator';

export default function FlowTestForm() {
  const [hydrants, setHydrants] = useState([]);
  const [selectedHydrantId, setSelectedHydrantId] = useState('');
  const [staticPsi, setStaticPsi] = useState('');
  const [residualPsi, setResidualPsi] = useState('');
  const [outlets, setOutlets] = useState([
    { size: 2.5, pitotPressure: '', coefficient: 0.9 }
  ]);
  const [weather, setWeather] = useState('');
  const [tempF, setTempF] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/hydrants');
        setHydrants(data.data.hydrants || []);
      } catch (e) {
        setError(e.response?.data || e.message);
      }
    })();
  }, []);

  const addOutlet = () => setOutlets([...outlets, { size: 2.5, pitotPressure: '', coefficient: 0.9 }]);
  const removeOutlet = (idx) => setOutlets(outlets.filter((_, i) => i !== idx));

  const updateOutlet = (idx, field, value) => {
    const copy = [...outlets];
    copy[idx] = { ...copy[idx], [field]: value };
    setOutlets(copy);
  };

  const validate = () => {
    if (!selectedHydrantId) return 'Select a hydrant';
    const s = parseFloat(staticPsi);
    const r = parseFloat(residualPsi);
    if (!s || s <= 0) return 'Static pressure is required and must be > 0';
    if (!r || r <= 0) return 'Residual pressure is required and must be > 0';
    if (r >= s) return 'Residual pressure must be less than static pressure';
    if (outlets.length < 1) return 'At least one outlet is required';
    for (const o of outlets) {
      const pp = parseFloat(o.pitotPressure);
      const sz = parseFloat(o.size);
      const cf = parseFloat(o.coefficient);
      if (!pp || pp <= 0) return 'Each outlet needs a pitot pressure > 0';
      if (!sz || sz <= 0) return 'Each outlet needs a size > 0';
      if (!cf || cf < 0.7 || cf > 1.0) return 'Coefficient must be between 0.7 and 1.0';
    }
    return null;
  };

  const submit = async () => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    try {
      const payload = {
        hydrant_id: selectedHydrantId,
        test_date: dayjs().format('YYYY-MM-DD'),
        static_pressure_psi: parseFloat(staticPsi),
        residual_pressure_psi: parseFloat(residualPsi),
        outlets: outlets.map(o => ({
          size: parseFloat(o.size),
          pitotPressure: parseFloat(o.pitotPressure),
          coefficient: parseFloat(o.coefficient)
        })),
        weather_conditions: weather || undefined,
        temperature_f: tempF ? parseInt(tempF, 10) : undefined,
        notes: notes || undefined
      };
      const res = await api.post('/flow-tests', payload);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePDF = () => {
    if (result?.flowTest) {
      const hydrant = hydrants.find(h => h.id === selectedHydrantId);
      generateFlowTestPDF(result.flowTest, hydrant);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>NFPA 291 Flow Test</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Hydrant"
            select
            SelectProps={{ native: true }}
            value={selectedHydrantId}
            onChange={(e) => setSelectedHydrantId(e.target.value)}
            fullWidth
          >
            <option value="">Select hydrant...</option>
            {hydrants.map(h => (
              <option key={h.id} value={h.id}>{h.hydrant_number} — {h.address}</option>
            ))}
          </TextField>
          <TextField label="Static PSI" type="number" value={staticPsi} onChange={e => setStaticPsi(e.target.value)} fullWidth />
          <TextField label="Residual PSI" type="number" value={residualPsi} onChange={e => setResidualPsi(e.target.value)} fullWidth />
        </Stack>

        <Typography variant="subtitle1" gutterBottom>Outlets</Typography>
        <Stack spacing={2}>
          {outlets.map((o, idx) => (
            <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField label="Size (in)" type="number" value={o.size} onChange={e => updateOutlet(idx, 'size', e.target.value)} fullWidth />
              <TextField label="Pitot (PSI)" type="number" value={o.pitotPressure} onChange={e => updateOutlet(idx, 'pitotPressure', e.target.value)} fullWidth />
              <TextField label="Coeff" type="number" value={o.coefficient} onChange={e => updateOutlet(idx, 'coefficient', e.target.value)} fullWidth />
              <IconButton color="error" onClick={() => removeOutlet(idx)} disabled={outlets.length === 1}>
                <RemoveCircle />
              </IconButton>
            </Stack>
          ))}
          <Button startIcon={<AddCircle />} onClick={addOutlet}>Add Outlet</Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
          <TextField label="Weather" value={weather} onChange={e => setWeather(e.target.value)} fullWidth />
          <TextField label="Temp (F)" type="number" value={tempF} onChange={e => setTempF(e.target.value)} fullWidth />
        </Stack>

        <TextField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline rows={3} sx={{ mt: 2 }} />

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={submit} disabled={submitting}>Submit Flow Test</Button>
        </Stack>
      </Paper>

      {result && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Typography variant="h6">Flow Test Created</Typography>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={generatePDF}
              size="small"
            >
              Generate PDF
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Test Number: {result.flowTest?.test_number}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label={`Total Flow: ${result.flowTest?.total_flow_gpm} GPM`} />
            <Chip label={`AFF: ${result.flowTest?.available_fire_flow_gpm} GPM`} color="primary" />
            <Chip label={`Class: ${result.flowTest?.nfpa_class}`} />
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
