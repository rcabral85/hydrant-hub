// HydrantHub - Quick Maintenance Modal
// Rapid condition assessment and maintenance recording from map
// Optimized for field inspections and immediate work order generation

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Typography, Stack, Chip, Paper,
  FormControl, InputLabel, Select, MenuItem, Alert, Box,
  Switch, FormControlLabel, Divider
} from '@mui/material';
import {
  Save, Cancel, Build, Visibility, Warning, CheckCircle,
  PhotoCamera, Assignment, Speed
} from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../services/api';

export default function MaintenanceQuickModal({ open, onClose, hydrant, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [photos, setPhotos] = useState([]);
  
  const [inspectionData, setInspectionData] = useState({
    inspection_date: dayjs().format('YYYY-MM-DD'),
    inspector_name: 'Rich Cabral',
    // inspector_license: 'WDO-ON-2019-1234',
    
    // Visual Assessment (Quick)
    paint_condition: '',
    body_condition: '',
    cap_condition: '',
    chains_present: null,
    clearance_adequate: null,
    
    // Valve Operation (Quick)
    valve_operation: '',
    static_pressure_psi: '',
    valve_leak_detected: false,
    
    // Critical Flags
    immediate_action_required: false,
    safety_hazard_description: '',
    
    // Assessment
    overall_condition: '',
    repair_needed: false,
    priority_level: 'LOW',
    inspector_notes: ''
  });

  const updateField = (field, value) => {
    setInspectionData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!inspectionData.paint_condition) {
      newErrors.paint_condition = 'Paint condition assessment required';
    }
    
    if (!inspectionData.body_condition) {
      newErrors.body_condition = 'Body condition assessment required';
    }
    
    if (!inspectionData.overall_condition) {
      newErrors.overall_condition = 'Overall condition assessment required';
    }
    
    if (inspectionData.immediate_action_required && !inspectionData.safety_hazard_description.trim()) {
      newErrors.safety_hazard_description = 'Safety hazard description required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;
  setLoading(true);
  setErrors({});

  try {
    const formData = new FormData();

    // 🔷 ADD THIS FIRST - inspection_type is required by validation
    formData.append('inspection_type', 'QUICK_MAINTENANCE');
    formData.append('hydrant_id', hydrant.id);

    // Append all inspection data
    Object.entries(inspectionData).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    // Attach photos
    photos.forEach(photo => {
      formData.append('inspection_photos', photo);
    });

    // Single API call
    const response = await api.post('/maintenance/inspections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.success) {
      onSuccess && onSuccess(response.data.inspection);
      onClose();

      if (response.data.workOrder) {
        alert(
          `✅ Inspection saved!\n🔧 Work Order #${response.data.workOrder.id} created\nPriority: ${response.data.workOrder.priority}`
        );
      } else {
        alert('✅ Maintenance inspection saved successfully!');
      }
    }
  } catch (error) {
    setErrors({ submit: 'Failed to submit inspection. Please try again.' });
    console.error(error);
  } finally {
    setLoading(false);
  }
};


  const getConditionColor = (condition) => {
    const colors = {
      'EXCELLENT': 'success',
      'GOOD': 'success',
      'FAIR': 'warning',
      'POOR': 'error',
      'CRITICAL': 'error'
    };
    return colors[condition] || 'default';
  };

  const getValveColor = (operation) => {
    const colors = {
      'SMOOTH': 'success',
      'STIFF': 'warning',
      'BINDING': 'error',
      'INOPERABLE': 'error'
    };
    return colors[operation] || 'default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Build />
          <div>
            <Typography variant="h6">
              Quick Maintenance Inspection - {hydrant?.hydrant_number}
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
          {/* Visual Assessment */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Visibility sx={{ mr: 1 }} />
                Visual Assessment
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth error={!!errors.paint_condition}>
                  <InputLabel>Paint Condition *</InputLabel>
                  <Select
                    value={inspectionData.paint_condition}
                    onChange={(e) => updateField('paint_condition', e.target.value)}
                    label="Paint Condition *"
                  >
                    <MenuItem value="EXCELLENT">🟢 Excellent - Like new</MenuItem>
                    <MenuItem value="GOOD">🟡 Good - Minor wear</MenuItem>
                    <MenuItem value="FAIR">🟠 Fair - Noticeable fading</MenuItem>
                    <MenuItem value="POOR">🔴 Poor - Significant wear</MenuItem>
                    <MenuItem value="CRITICAL">⚫ Critical - Immediate attention</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth error={!!errors.body_condition}>
                  <InputLabel>Body Condition *</InputLabel>
                  <Select
                    value={inspectionData.body_condition}
                    onChange={(e) => updateField('body_condition', e.target.value)}
                    label="Body Condition *"
                  >
                    <MenuItem value="EXCELLENT">🟢 Excellent - No damage</MenuItem>
                    <MenuItem value="GOOD">🟡 Good - Minor surface wear</MenuItem>
                    <MenuItem value="FAIR">🟠 Fair - Some corrosion</MenuItem>
                    <MenuItem value="POOR">🔴 Poor - Structural concerns</MenuItem>
                    <MenuItem value="CRITICAL">⚫ Critical - Safety hazard</MenuItem>
                  </Select>
                </FormControl>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Cap Condition</InputLabel>
                      <Select
                        value={inspectionData.cap_condition}
                        onChange={(e) => updateField('cap_condition', e.target.value)}
                        label="Cap Condition"
                      >
                        <MenuItem value="EXCELLENT">Excellent</MenuItem>
                        <MenuItem value="GOOD">Good</MenuItem>
                        <MenuItem value="FAIR">Fair</MenuItem>
                        <MenuItem value="POOR">Poor</MenuItem>
                        <MenuItem value="MISSING">Missing</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={inspectionData.chains_present}
                          onChange={(e) => updateField('chains_present', e.target.checked)}
                          color={inspectionData.chains_present ? 'success' : 'error'}
                        />
                      }
                      label={inspectionData.chains_present ? '✓ Chains OK' : '✗ Chains Missing'}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={
                    <Switch
                      checked={inspectionData.clearance_adequate}
                      onChange={(e) => updateField('clearance_adequate', e.target.checked)}
                      color={inspectionData.clearance_adequate ? 'success' : 'error'}
                    />
                  }
                  label={inspectionData.clearance_adequate ? '✓ 3+ Feet Clear' : '⚠️ Clearance Issue'}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Valve Operation */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ mr: 1 }} />
                Valve Operation
              </Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Valve Operation</InputLabel>
                  <Select
                    value={inspectionData.valve_operation}
                    onChange={(e) => updateField('valve_operation', e.target.value)}
                    label="Valve Operation"
                  >
                    <MenuItem value="SMOOTH">🟢 Smooth - Normal operation</MenuItem>
                    <MenuItem value="STIFF">🟡 Stiff - Extra force needed</MenuItem>
                    <MenuItem value="BINDING">🟠 Binding - Difficult to turn</MenuItem>
                    <MenuItem value="INOPERABLE">🔴 Inoperable - Cannot operate</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Static Pressure (PSI)"
                  type="number"
                  step="0.1"
                  value={inspectionData.static_pressure_psi}
                  onChange={(e) => updateField('static_pressure_psi', e.target.value)}
                  placeholder="72.5"
                  helperText="Optional - if pressure gauge available"
                  fullWidth
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={inspectionData.valve_leak_detected}
                      onChange={(e) => updateField('valve_leak_detected', e.target.checked)}
                      color={inspectionData.valve_leak_detected ? 'error' : 'success'}
                    />
                  }
                  label={inspectionData.valve_leak_detected ? '⚠️ Leak Detected' : '✓ No Leaks'}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Critical Safety Assessment */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: inspectionData.immediate_action_required ? 'error.light' : 'background.paper' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ mr: 1 }} />
                Safety Assessment
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={inspectionData.immediate_action_required}
                    onChange={(e) => updateField('immediate_action_required', e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Typography sx={{ fontWeight: inspectionData.immediate_action_required ? 700 : 400 }}>
                    {inspectionData.immediate_action_required ? 
                      '⚠️ IMMEDIATE ACTION REQUIRED' : 
                      '✓ No Immediate Safety Concerns'}
                  </Typography>
                }
              />
              
              {inspectionData.immediate_action_required && (
                <TextField
                  label="Safety Hazard Description *"
                  value={inspectionData.safety_hazard_description}
                  onChange={(e) => updateField('safety_hazard_description', e.target.value)}
                  error={!!errors.safety_hazard_description}
                  helperText={errors.safety_hazard_description || 'Describe the immediate safety concern'}
                  placeholder="Valve inoperable, clearance blocked, structural damage, etc."
                  multiline
                  rows={2}
                  fullWidth
                  required
                  sx={{ mt: 2 }}
                />
              )}
            </Paper>
          </Grid>

          {/* Overall Assessment */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Overall Assessment</Typography>
              
              <Stack spacing={2}>
                <FormControl fullWidth error={!!errors.overall_condition}>
                  <InputLabel>Overall Condition *</InputLabel>
                  <Select
                    value={inspectionData.overall_condition}
                    onChange={(e) => updateField('overall_condition', e.target.value)}
                    label="Overall Condition *"
                  >
                    <MenuItem value="EXCELLENT">🟢 Excellent</MenuItem>
                    <MenuItem value="GOOD">🟡 Good</MenuItem>
                    <MenuItem value="FAIR">🟠 Fair</MenuItem>
                    <MenuItem value="POOR">🔴 Poor</MenuItem>
                    <MenuItem value="CRITICAL">⚫ Critical</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={inspectionData.repair_needed}
                      onChange={(e) => updateField('repair_needed', e.target.checked)}
                      color="warning"
                    />
                  }
                  label={inspectionData.repair_needed ? '⚠️ Repair/Maintenance Needed' : '✓ No Repairs Needed'}
                />

                {inspectionData.repair_needed && (
                  <FormControl fullWidth>
                    <InputLabel>Priority Level</InputLabel>
                    <Select
                      value={inspectionData.priority_level}
                      onChange={(e) => updateField('priority_level', e.target.value)}
                      label="Priority Level"
                    >
                      <MenuItem value="LOW">🟢 Low - Schedule within 6 months</MenuItem>
                      <MenuItem value="MEDIUM">🟡 Medium - Schedule within 3 months</MenuItem>
                      <MenuItem value="HIGH">🟠 High - Schedule within 1 month</MenuItem>
                      <MenuItem value="CRITICAL">🔴 Critical - Immediate action</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Documentation */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Documentation</Typography>
              
              <Stack spacing={2}>
                <TextField
                  label="Inspector Notes"
                  value={inspectionData.inspector_notes}
                  onChange={(e) => updateField('inspector_notes', e.target.value)}
                  placeholder="Additional observations, recommendations, or concerns..."
                  multiline
                  rows={3}
                  fullWidth
                />

                <Button 
                  variant="outlined" 
                  startIcon={<PhotoCamera />}
                  onClick={handlePhotoCapture}
                  fullWidth
                >
                  Take Photos ({photos.length} captured)
                </Button>

                {photos.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {photos.map((photo, index) => (
                      <Chip key={index} label={`Photo ${index + 1}`} size="small" />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Inspection Preview */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>Inspection Summary</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="body2">Paint</Typography>
                <Chip 
                  label={inspectionData.paint_condition || 'Not assessed'}
                  color={getConditionColor(inspectionData.paint_condition)}
                  size="small"
                />
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="body2">Body</Typography>
                <Chip 
                  label={inspectionData.body_condition || 'Not assessed'}
                  color={getConditionColor(inspectionData.body_condition)}
                  size="small"
                />
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="body2">Valve</Typography>
                <Chip 
                  label={inspectionData.valve_operation || 'Not tested'}
                  color={getValveColor(inspectionData.valve_operation)}
                  size="small"
                />
              </Stack>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Stack alignItems="center">
                <Typography variant="body2">Overall</Typography>
                <Chip 
                  label={inspectionData.overall_condition || 'TBD'}
                  color={getConditionColor(inspectionData.overall_condition)}
                  size="small"
                />
              </Stack>
            </Grid>
          </Grid>

          {(inspectionData.repair_needed || inspectionData.immediate_action_required) && (
            <Alert 
              severity={inspectionData.immediate_action_required ? 'error' : 'warning'} 
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                <strong>
                  {inspectionData.immediate_action_required ? 
                    'CRITICAL: Immediate work order will be generated' :
                    'Work order will be created for scheduled maintenance'}
                </strong>
                <br />
                Priority: {inspectionData.priority_level}
                {inspectionData.repair_needed && ` | Estimated completion: ${inspectionData.priority_level === 'CRITICAL' ? 'Within 24 hours' :
                                                                            inspectionData.priority_level === 'HIGH' ? 'Within 1 month' :
                                                                            inspectionData.priority_level === 'MEDIUM' ? 'Within 3 months' :
                                                                            'Within 6 months'}`}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading || !inspectionData.paint_condition || !inspectionData.body_condition || !inspectionData.overall_condition}
        >
          {loading ? 'Saving...' : 'Save Inspection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}