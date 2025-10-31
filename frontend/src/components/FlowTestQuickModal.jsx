// HydrantHub - Quick Flow Test Modal
// NFPA 291 compliant flow test recording from map or dashboard
// Real-time calculations and validation

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Typography, Alert, Stack, Chip, Divider,
  FormControl, InputLabel, Select, MenuItem, Box, Paper,
  InputAdornment, IconButton
} from '@mui/material';
import {
  Save, Cancel, Add, Remove, Calculate, Thermostat,
  Opacity, Timeline, CheckCircle
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../services/api';

export default function FlowTestQuickModal({ open, onClose, hydrant, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [calculations, setCalculations] = useState({
    total_flow_gpm: 0,
    nfpa_class: '',
    available_flow_20psi: 0
  });
  
  const [testData, setTestData] = useState({
    test_date: dayjs().format('YYYY-MM-DD'),
    operator_name: 'Rich Cabral',
    operator_license: 'WDO-ON-2019-1234',
    static_pressure_psi: '',
    residual_pressure_psi: '',
    weather_conditions: 'Clear',
    temperature_celsius: '',
    outlets: [
      { size: 2.5, pitot_pressure_psi: '', coefficient: 0.90 }
    ],
    notes: ''
  });

  useEffect(() => {
    calculateFlow();
  }, [testData.static_pressure_psi, testData.residual_pressure_psi, testData.outlets]);

  const updateField = (field, value) => {
    setTestData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateOutlet = (index, field, value) => {
    const newOutlets = [...testData.outlets];
    newOutlets[index] = { ...newOutlets[index], [field]: value };
    setTestData(prev => ({ ...prev, outlets: newOutlets }));
  };

  const addOutlet = () => {
    setTestData(prev => ({
      ...prev,
      outlets: [...prev.outlets, { size: 2.5, pitot_pressure_psi: '', coefficient: 0.90 }]
    }));
  };

  const removeOutlet = (index) => {
    if (testData.outlets.length > 1) {
      setTestData(prev => ({
        ...prev,
        outlets: prev.outlets.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateFlow = () => {
    try {
      let totalFlow = 0;
      
      testData.outlets.forEach(outlet => {
        if (outlet.pitot_pressure_psi && outlet.size && outlet.coefficient) {
          // NFPA 291 Formula: Q = 29.83 × c × d² × √P
          const flow = 29.83 * outlet.coefficient * 
                      Math.pow(outlet.size, 2) * 
                      Math.sqrt(parseFloat(outlet.pitot_pressure_psi));
          totalFlow += flow;
        }
      });

      // Determine NFPA Classification
      let nfpaClass = '';
      if (totalFlow >= 1500) nfpaClass = 'AA';
      else if (totalFlow >= 1000) nfpaClass = 'A';
      else if (totalFlow >= 500) nfpaClass = 'B';
      else if (totalFlow > 0) nfpaClass = 'C';

      // Available flow at 20 PSI residual (simplified calculation)
      const availableFlow20 = testData.residual_pressure_psi ? 
        totalFlow * Math.sqrt(20 / parseFloat(testData.residual_pressure_psi || 1)) : 0;

      setCalculations({
        total_flow_gpm: Math.round(totalFlow),
        nfpa_class: nfpaClass,
        available_flow_20psi: Math.round(availableFlow20)
      });
    } catch (error) {
      console.log('Calculation error:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!testData.static_pressure_psi || testData.static_pressure_psi < 20 || testData.static_pressure_psi > 150) {
      newErrors.static_pressure_psi = 'Static pressure required (20-150 PSI)';
    }
    
    if (!testData.residual_pressure_psi || testData.residual_pressure_psi < 10 || testData.residual_pressure_psi > 150) {
      newErrors.residual_pressure_psi = 'Residual pressure required (10-150 PSI)';
    }
    
    if (parseFloat(testData.residual_pressure_psi) >= parseFloat(testData.static_pressure_psi)) {
      newErrors.residual_pressure_psi = 'Residual must be less than static pressure';
    }
    
    testData.outlets.forEach((outlet, index) => {
      if (!outlet.pitot_pressure_psi || outlet.pitot_pressure_psi < 5 || outlet.pitot_pressure_psi > 100) {
        newErrors[`outlet_${index}`] = 'Pitot pressure required (5-100 PSI)';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        hydrant_id: hydrant.id,
        test_date: testData.test_date,
        operator_name: testData.operator_name,
        operator_license: testData.operator_license,
        static_pressure_psi: parseFloat(testData.static_pressure_psi),
        residual_pressure_psi: parseFloat(testData.residual_pressure_psi),
        total_flow_gpm: calculations.total_flow_gpm,
        nfpa_class: calculations.nfpa_class,
        available_flow_20psi: calculations.available_flow_20psi,
        weather_conditions: testData.weather_conditions,
        temperature_celsius: testData.temperature_celsius ? parseFloat(testData.temperature_celsius) : null,
        outlets: testData.outlets.map(outlet => ({
          size: parseFloat(outlet.size),
          pitot_pressure_psi: parseFloat(outlet.pitot_pressure_psi),
          coefficient: parseFloat(outlet.coefficient),
          flow_gpm: 29.83 * outlet.coefficient * Math.pow(outlet.size, 2) * Math.sqrt(outlet.pitot_pressure_psi)
        })),
        notes: testData.notes
      };

      const response = await api.post('/flow-tests', submitData);
      
      if (response.data.success || response.data.flowTest) {
        onSuccess && onSuccess(response.data.flowTest || response.data);
        onClose();
        
        // Reset form
        setTestData(prev => ({
          ...prev,
          static_pressure_psi: '',
          residual_pressure_psi: '',
          temperature_celsius: '',
          outlets: [{ size: 2.5, pitot_pressure_psi: '', coefficient: 0.90 }],
          notes: ''
        }));
      }
    } catch (error) {
      console.error('Error submitting flow test:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to submit flow test' });
    } finally {
      setLoading(false);
    }
  };

  const getNFPAColor = (nfpaClass) => {
    const colors = {
      'AA': 'success',
      'A': 'success', 
      'B': 'warning',
      'C': 'error'
    };
    return colors[nfpaClass] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Timeline />
          <div>
            <Typography variant="h6">
              NFPA 291 Flow Test - {hydrant?.hydrant_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hydrant?.location_address}
            </Typography>
          </div>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.submit}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Test Parameters */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Test Parameters</Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Test Date"
                  type="date"
                  value={testData.test_date}
                  onChange={(e) => updateField('test_date', e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  label="Static Pressure (PSI) *"
                  type="number"
                  step="0.1"
                  value={testData.static_pressure_psi}
                  onChange={(e) => updateField('static_pressure_psi', e.target.value)}
                  error={!!errors.static_pressure_psi}
                  helperText={errors.static_pressure_psi || 'Pressure before flow'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Opacity /></InputAdornment>
                  }}
                  fullWidth
                  required
                />

                <TextField
                  label="Residual Pressure (PSI) *"
                  type="number"
                  step="0.1"
                  value={testData.residual_pressure_psi}
                  onChange={(e) => updateField('residual_pressure_psi', e.target.value)}
                  error={!!errors.residual_pressure_psi}
                  helperText={errors.residual_pressure_psi || 'Pressure during flow'}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Opacity /></InputAdornment>
                  }}
                  fullWidth
                  required
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Weather</InputLabel>
                      <Select
                        value={testData.weather_conditions}
                        onChange={(e) => updateField('weather_conditions', e.target.value)}
                        label="Weather"
                      >
                        <MenuItem value="Clear">Clear</MenuItem>
                        <MenuItem value="Overcast">Overcast</MenuItem>
                        <MenuItem value="Light rain">Light rain</MenuItem>
                        <MenuItem value="Heavy rain">Heavy rain</MenuItem>
                        <MenuItem value="Snow">Snow</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Temperature (°C)"
                      type="number"
                      value={testData.temperature_celsius}
                      onChange={(e) => updateField('temperature_celsius', e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Thermostat /></InputAdornment>
                      }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>

          {/* Outlet Configuration */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Outlets</Typography>
                <Button 
                  size="small" 
                  startIcon={<Add />} 
                  onClick={addOutlet}
                  disabled={testData.outlets.length >= 4}
                >
                  Add Outlet
                </Button>
              </Stack>
              
              <Stack spacing={2}>
                {testData.outlets.map((outlet, index) => (
                  <Paper key={index} sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">
                        Outlet {index + 1}
                      </Typography>
                      {testData.outlets.length > 1 && (
                        <IconButton 
                          size="small" 
                          onClick={() => removeOutlet(index)}
                          color="error"
                        >
                          <Remove />
                        </IconButton>
                      )}
                    </Stack>
                    
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <TextField
                          label="Size (in)"
                          type="number"
                          step="0.5"
                          value={outlet.size}
                          onChange={(e) => updateOutlet(index, 'size', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Pitot PSI *"
                          type="number"
                          step="0.1"
                          value={outlet.pitot_pressure_psi}
                          onChange={(e) => updateOutlet(index, 'pitot_pressure_psi', e.target.value)}
                          error={!!errors[`outlet_${index}`]}
                          size="small"
                          fullWidth
                          required
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          label="Coefficient"
                          type="number"
                          step="0.01"
                          value={outlet.coefficient}
                          onChange={(e) => updateOutlet(index, 'coefficient', e.target.value)}
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    
                    {outlet.pitot_pressure_psi && outlet.size && outlet.coefficient && (
                      <Typography variant="body2" color="primary.main" sx={{ mt: 1, fontWeight: 600 }}>
                        Flow: {Math.round(29.83 * outlet.coefficient * Math.pow(outlet.size, 2) * Math.sqrt(outlet.pitot_pressure_psi))} GPM
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Real-time Calculations */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Calculate sx={{ mr: 1 }} />
                Live NFPA 291 Calculations
              </Typography>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {calculations.total_flow_gpm.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">Total Flow (GPM)</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {calculations.nfpa_class || 'TBD'}
                    </Typography>
                    <Typography variant="body2">NFPA Classification</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {calculations.available_flow_20psi.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">Available @ 20 PSI</Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {calculations.nfpa_class && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Chip 
                    label={`Class ${calculations.nfpa_class} - ${calculations.nfpa_class === 'AA' ? 'Excellent' : 
                                                                 calculations.nfpa_class === 'A' ? 'Good' : 
                                                                 calculations.nfpa_class === 'B' ? 'Adequate' : 'Poor'}`}
                    sx={{ 
                      bgcolor: calculations.nfpa_class === 'AA' || calculations.nfpa_class === 'A' ? '#4caf50' :
                               calculations.nfpa_class === 'B' ? '#ff9800' : '#f44336',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              label="Test Notes"
              value={testData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Weather conditions, special observations, equipment used..."
              multiline
              rows={3}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading || !calculations.total_flow_gpm}
        >
          {loading ? 'Saving...' : 'Save Flow Test'}
        </Button>
      </DialogActions>
      
      {/* Validation Summary */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip 
            icon={testData.static_pressure_psi ? <CheckCircle /> : <Cancel />}
            label="Static Pressure"
            color={testData.static_pressure_psi ? 'success' : 'default'}
            size="small"
          />
          <Chip 
            icon={testData.residual_pressure_psi ? <CheckCircle /> : <Cancel />}
            label="Residual Pressure"
            color={testData.residual_pressure_psi ? 'success' : 'default'}
            size="small"
          />
          <Chip 
            icon={testData.outlets.every(o => o.pitot_pressure_psi) ? <CheckCircle /> : <Cancel />}
            label={`${testData.outlets.length} Outlets`}
            color={testData.outlets.every(o => o.pitot_pressure_psi) ? 'success' : 'default'}
            size="small"
          />
          <Chip 
            icon={calculations.total_flow_gpm > 0 ? <CheckCircle /> : <Cancel />}
            label="Calculations"
            color={calculations.total_flow_gpm > 0 ? 'success' : 'default'}
            size="small"
          />
        </Stack>
      </Box>
    </Dialog>
  );
}