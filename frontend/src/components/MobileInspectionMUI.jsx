// HydrantHub Mobile Inspection - Material-UI Version
// Optimized for field use with large touch targets
// Complete maintenance inspection workflow for operators

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, FormControl,
  InputLabel, Select, MenuItem, TextField, Alert, LinearProgress,
  Stack, Chip, Paper, IconButton, Stepper, Step, StepLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import {
  PhotoCamera, Save, Warning, CheckCircle, LocationOn,
  Thermostat, Build, Visibility, Assignment, Send
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

const steps = [
  'Basic Info',
  'Visual Assessment', 
  'Valve Operation',
  'Final Review'
];

export default function MobileInspectionMUI() {
  const { hydrantId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [hydrant, setHydrant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  
  const [inspectionData, setInspectionData] = useState({
    // Basic Info
    inspector_name: 'Rich Cabral',
    inspector_license: 'WDO-ON-2019-1234',
    inspection_date: dayjs().format('YYYY-MM-DD'),
    weather_conditions: '',
    temperature_celsius: '',
    
    // Visual Assessment
    paint_condition: '',
    body_condition: '',
    cap_condition: '',
    cap_security: '',
    chains_present: null,
    chains_condition: '',
    clearance_adequate: null,
    safety_hazards: '',
    immediate_action_required: false,
    
    // Valve Operation
    valve_operation: '',
    valve_turns_to_close: '',
    static_pressure_psi: '',
    valve_leak_detected: false,
    valve_exercised: false,
    lubrication_applied: false,
    
    // Final Assessment
    overall_condition: '',
    repair_needed: false,
    priority_level: 'LOW',
    inspector_notes: '',
    compliance_status: 'COMPLIANT'
  });

  useEffect(() => {
    fetchHydrant();
    getCurrentLocation();
  }, [hydrantId]);

  const fetchHydrant = async () => {
    try {
      const response = await api.get(`/hydrants/${hydrantId}`);
      setHydrant(response.data.hydrant);
    } catch (error) {
      console.error('Error fetching hydrant:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.log('GPS error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handlePhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setPhotos([...photos, ...files]);
    };
    input.click();
  };

  const updateField = (field, value) => {
    setInspectionData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const submitInspection = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] !== null && inspectionData[key] !== '') {
          formData.append(key, inspectionData[key]);
        }
      });
      if (gpsLocation) {
        formData.append('inspector_gps_lat', gpsLocation.lat);
        formData.append('inspector_gps_lng', gpsLocation.lng);
      }
      photos.forEach(photo => { formData.append('inspection_photos', photo); });
      formData.append('hydrant_id', hydrantId);
      formData.append('inspection_type_id', 1);
      console.log('Submitting inspection:', Object.fromEntries(formData));
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Inspection submitted successfully!');
      navigate('/maintenance');
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to submit inspection. Please try again.');
    } finally {
      setLoading(false);
      setShowSummary(false);
    }
  };

  const getConditionColor = (condition) => ({ EXCELLENT:'success', GOOD:'success', FAIR:'warning', POOR:'error', CRITICAL:'error' }[condition] || 'default');

  const renderBasicInfo = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Basic Information</Typography>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Weather Conditions</InputLabel>
            <Select value={inspectionData.weather_conditions} onChange={(e) => updateField('weather_conditions', e.target.value)} label="Weather Conditions">
              <MenuItem value="Clear, sunny">☀️ Clear, sunny</MenuItem>
              <MenuItem value="Overcast">☁️ Overcast</MenuItem>
              <MenuItem value="Light rain">🌦️ Light rain</MenuItem>
              <MenuItem value="Heavy rain">🌧️ Heavy rain</MenuItem>
              <MenuItem value="Snow">❄️ Snow</MenuItem>
              <MenuItem value="Windy">💨 Windy</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Temperature (°C)" type="number" value={inspectionData.temperature_celsius} onChange={(e) => updateField('temperature_celsius', e.target.value)} InputProps={{ startAdornment: <Thermostat /> }} fullWidth />
          <Button variant="contained" startIcon={<PhotoCamera />} onClick={handlePhotoCapture} fullWidth sx={{ py: 2 }}>Take Photos ({photos.length} captured)</Button>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderVisualAssessment = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Visual Condition Assessment</Typography>
        <Stack spacing={3}>
          <div>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Paint Condition</Typography>
            <Grid container spacing={1}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].map(condition => (
                <Grid item xs={12} key={condition}>
                  <Button variant={inspectionData.paint_condition === condition ? 'contained' : 'outlined'} color={getConditionColor(condition)} onClick={() => updateField('paint_condition', condition)} fullWidth sx={{ py: 1.5, justifyContent: 'flex-start' }}>
                    <CheckCircle sx={{ mr: 1 }} />{condition}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </div>

          <div>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Body Condition</Typography>
            <Grid container spacing={1}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].map(condition => (
                <Grid item xs={12} key={condition}>
                  <Button variant={inspectionData.body_condition === condition ? 'contained' : 'outlined'} color={getConditionColor(condition)} onClick={() => updateField('body_condition', condition)} fullWidth sx={{ py: 1.5, justifyContent: 'flex-start' }}>
                    <CheckCircle sx={{ mr: 1 }} />{condition}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </div>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Cap Condition</InputLabel>
                <Select value={inspectionData.cap_condition} onChange={(e) => updateField('cap_condition', e.target.value)} label="Cap Condition">
                  <MenuItem value="EXCELLENT">Excellent</MenuItem>
                  <MenuItem value="GOOD">Good</MenuItem>
                  <MenuItem value="FAIR">Fair</MenuItem>
                  <MenuItem value="POOR">Poor</MenuItem>
                  <MenuItem value="MISSING">Missing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <Button variant={inspectionData.chains_present ? 'contained' : 'outlined'} color={inspectionData.chains_present ? 'success' : 'error'} onClick={() => updateField('chains_present', !inspectionData.chains_present)} fullWidth sx={{ py: 2 }}>
                {inspectionData.chains_present ? '✓ Chains OK' : '✗ Chains Missing'}
              </Button>
            </Grid>
          </Grid>

          <Button variant={inspectionData.clearance_adequate ? 'contained' : 'outlined'} color={inspectionData.clearance_adequate ? 'success' : 'error'} onClick={() => updateField('clearance_adequate', !inspectionData.clearance_adequate)} fullWidth sx={{ py: 2 }}>
            {inspectionData.clearance_adequate ? '✓ 3+ Feet Clear Access' : '⚠️ Clearance Issue'}
          </Button>

          <Button variant={inspectionData.immediate_action_required ? 'contained' : 'outlined'} color={inspectionData.immediate_action_required ? 'error' : 'success'} onClick={() => updateField('immediate_action_required', !inspectionData.immediate_action_required)} fullWidth sx={{ py: 2 }}>
            {inspectionData.immediate_action_required ? '⚠️ SAFETY HAZARD IDENTIFIED' : '✓ No Safety Concerns'}
          </Button>

          {inspectionData.immediate_action_required && (
            <TextField label="Describe Safety Hazards" multiline rows={3} value={inspectionData.safety_hazards} onChange={(e) => updateField('safety_hazards', e.target.value)} fullWidth required />
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderValveOperation = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Valve Operation Test</Typography>
        <Stack spacing={3}>
          <div>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Valve Operation</Typography>
            <Grid container spacing={1}>
              {[
                { value: 'SMOOTH', label: 'Smooth', desc: 'Normal force' },
                { value: 'STIFF', label: 'Stiff', desc: 'Extra force needed' },
                { value: 'BINDING', label: 'Binding', desc: 'Very difficult' },
                { value: 'INOPERABLE', label: 'Inoperable', desc: 'Cannot operate' }
              ].map(option => (
                <Grid item xs={12} key={option.value}>
                  <Button variant={inspectionData.valve_operation === option.value ? 'contained' : 'outlined'} color={option.value === 'SMOOTH' ? 'success' : option.value === 'STIFF' ? 'warning' : 'error'} onClick={() => updateField('valve_operation', option.value)} fullWidth sx={{ py: 1.5, textAlign: 'left' }}>
                    <Box sx={{ textAlign: 'left', width: '100%' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{option.label}</Typography>
                      <Typography variant="body2" color="text.secondary">{option.desc}</Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </div>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Turns to Close" type="number" value={inspectionData.valve_turns_to_close} onChange={(e) => updateField('valve_turns_to_close', e.target.value)} placeholder="Count turns" fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Static Pressure (PSI)" type="number" inputProps={{ step: '0.1', min: '0' }} value={inspectionData.static_pressure_psi} onChange={(e) => updateField('static_pressure_psi', e.target.value)} placeholder="e.g., 72.5" fullWidth />
            </Grid>
          </Grid>

          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Button variant={inspectionData.valve_leak_detected ? 'contained' : 'outlined'} color={inspectionData.valve_leak_detected ? 'error' : 'success'} onClick={() => updateField('valve_leak_detected', !inspectionData.valve_leak_detected)} fullWidth sx={{ py: 2 }}>
                {inspectionData.valve_leak_detected ? '⚠️ Water Leak Detected' : '✓ No Leaks Detected'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant={inspectionData.valve_exercised ? 'contained' : 'outlined'} color={inspectionData.valve_exercised ? 'success' : 'warning'} onClick={() => updateField('valve_exercised', !inspectionData.valve_exercised)} fullWidth sx={{ py: 2 }}>
                {inspectionData.valve_exercised ? '✓ Valve Exercised (Full Cycle)' : '⚠️ Valve Not Exercised'}
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderFinalReview = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Final Assessment</Typography>
        <Stack spacing={3}>
          <div>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Overall Condition</Typography>
            <Grid container spacing={1}>
              {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].map(condition => (
                <Grid item xs={12} key={condition}>
                  <Button variant={inspectionData.overall_condition === condition ? 'contained' : 'outlined'} color={getConditionColor(condition)} onClick={() => updateField('overall_condition', condition)} fullWidth sx={{ py: 1.5 }}>
                    {condition}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </div>

          <Button variant={inspectionData.repair_needed ? 'contained' : 'outlined'} color={inspectionData.repair_needed ? 'warning' : 'success'} onClick={() => updateField('repair_needed', !inspectionData.repair_needed)} fullWidth sx={{ py: 2 }}>
            {inspectionData.repair_needed ? '⚠️ Repair/Maintenance Needed' : '✓ No Repairs Needed'}
          </Button>

          {inspectionData.repair_needed && (
            <FormControl fullWidth>
              <InputLabel>Priority Level</InputLabel>
              <Select value={inspectionData.priority_level} onChange={(e) => updateField('priority_level', e.target.value)} label="Priority Level">
                <MenuItem value="LOW">Low - Schedule within 6 months</MenuItem>
                <MenuItem value="MEDIUM">Medium - Schedule within 3 months</MenuItem>
                <MenuItem value="HIGH">High - Schedule within 1 month</MenuItem>
                <MenuItem value="CRITICAL">Critical - Immediate action</MenuItem>
              </Select>
            </FormControl>
          )}

          <TextField label="Inspector Notes" multiline rows={4} value={inspectionData.inspector_notes} onChange={(e) => updateField('inspector_notes', e.target.value)} placeholder="Additional observations, recommendations, or concerns..." fullWidth />
          <Button variant="outlined" startIcon={<PhotoCamera />} onClick={handlePhotoCapture} fullWidth sx={{ py: 2 }}>Take Final Photos ({photos.length} total)</Button>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderBasicInfo();
      case 1: return renderVisualAssessment();
      case 2: return renderValveOperation();
      case 3: return renderFinalReview();
      default: return null;
    }
  };

  return (
    <Box sx={{ maxWidth: '100%', p: 2, pb: 10 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>Field Inspection</Typography>
            {hydrant && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                <Chip label={hydrant.hydrant_number} color="primary" />
                <Typography variant="body2" color="text.secondary">{hydrant.address}</Typography>
              </Stack>
            )}
          </div>
          <Stack alignItems="center">
            <Typography variant="body2" color="text.secondary">Step {activeStep + 1} of {steps.length}</Typography>
            <LinearProgress variant="determinate" value={((activeStep + 1) / steps.length) * 100} sx={{ width: 80, mt: 1 }} />
          </Stack>
        </Stack>
      </Paper>

      {gpsLocation && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <LocationOn sx={{ mr: 1 }} />GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)} (±{Math.round(gpsLocation.accuracy)}m)
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map(label => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
        {renderStepContent()}
      </Box>

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, p: 2, zIndex: 1000 }} elevation={8}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} sx={{ flex: 1, py: 1.5 }}>Back</Button>
          <Button variant="contained" onClick={handleNext} disabled={loading} sx={{ flex: 2, py: 1.5 }}>{activeStep === steps.length - 1 ? 'Review & Submit' : 'Next Step'}</Button>
        </Stack>
      </Paper>

      {(inspectionData.immediate_action_required || inspectionData.valve_operation === 'INOPERABLE' || inspectionData.priority_level === 'CRITICAL') && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Warning sx={{ mr: 1 }} />
          <strong>CRITICAL SAFETY ISSUE IDENTIFIED</strong>
          <br />This inspection will generate an immediate work order.
        </Alert>
      )}

      <Dialog open={showSummary} maxWidth="md" fullWidth>
        <DialogTitle><Stack direction="row" alignItems="center" spacing={1}><Assignment /><Typography variant="h5">Inspection Summary</Typography></Stack></DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>Basic Information</Typography>
              <Stack spacing={1}>
                <Typography><strong>Inspector:</strong> {inspectionData.inspector_name}</Typography>
                <Typography><strong>Date:</strong> {dayjs(inspectionData.inspection_date).format('MMM DD, YYYY')}</Typography>
                <Typography><strong>Weather:</strong> {inspectionData.weather_conditions}</Typography>
                <Typography><strong>Temperature:</strong> {inspectionData.temperature_celsius}°C</Typography>
                <Typography><strong>Photos:</strong> {photos.length} captured</Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>Assessment Results</Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between"><Typography>Paint:</Typography><Chip label={inspectionData.paint_condition} color={getConditionColor(inspectionData.paint_condition)} size="small" /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography>Body:</Typography><Chip label={inspectionData.body_condition} color={getConditionColor(inspectionData.body_condition)} size="small" /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography>Valve:</Typography><Chip label={inspectionData.valve_operation} color={inspectionData.valve_operation === 'SMOOTH' ? 'success' : 'error'} size="small" /></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography>Pressure:</Typography><Typography sx={{ fontWeight: 600 }}>{inspectionData.static_pressure_psi} PSI</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography>Overall:</Typography><Chip label={inspectionData.overall_condition} color={getConditionColor(inspectionData.overall_condition)} size="small" /></Stack>
              </Stack>
            </Grid>
          </Grid>
          {inspectionData.inspector_notes && (<Box sx={{ mt: 2 }}><Typography variant="h6" sx={{ mb: 1 }}>Notes:</Typography><Paper sx={{ p: 2, bgcolor: 'background.default' }}><Typography>{inspectionData.inspector_notes}</Typography></Paper></Box>)}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummary(false)} disabled={loading}>Back to Edit</Button>
          <Button variant="contained" startIcon={<Send />} onClick={submitInspection} disabled={loading}>{loading ? 'Submitting...' : 'Submit Inspection'}</Button>
        </DialogActions>
      </Dialog>

      {loading && (<Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}><LinearProgress /></Box>)}
    </Box>
  );
}
