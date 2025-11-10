// HydrantHub - Add New Hydrant Component (with Address Geocoding)
// Geocoding: Enter address, auto-set latitude/longitude using Nominatim
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Paper,
  Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, InputAdornment, IconButton
} from '@mui/material';
import {
  Save, Cancel, LocationOn, Map as MapIcon, MyLocation, Business,
  DateRange, Build, Straighten, Opacity, Search
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';

const MapPicker = ({ lat, lng, onLocationSelect, open, onClose }) => {
  const [selectedLat, setSelectedLat] = useState(lat || 43.5182);
  const [selectedLng, setSelectedLng] = useState(lng || -79.8774);
  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng);
    onClose();
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Hydrant Location</DialogTitle>
      <DialogContent>
        <Box sx={{ height: 400, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            Interactive Map Picker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            (Click to select location)
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField label="Latitude" type="number" step="0.000001" value={selectedLat} onChange={(e) => setSelectedLat(parseFloat(e.target.value))} fullWidth />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Longitude" type="number" step="0.000001" value={selectedLng} onChange={(e) => setSelectedLng(parseFloat(e.target.value))} fullWidth />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>Confirm Location</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function HydrantAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [hydrantData, setHydrantData] = useState({
    hydrant_number: '',
    manufacturer: '',
    model: '',
    installation_date: dayjs(),
    latitude: 43.5182, // Default to Milton, ON
    longitude: -79.8774,
    location_address: '',
    location_description: '',
    watermain_size_mm: 200,
    static_pressure_psi: '',
    operational_status: 'OPERATIONAL',
    nfpa_classification: '',
    inspector_notes: ''
  });

  // Get current GPS location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHydrantData(prev => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude }));
        },
        (error) => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  const manufacturers = [
    'Mueller', 'American Flow Control', 'Waterous', 'Kennedy Valve',
    'Clow Valve', 'AVK', 'Kupferle', 'Other'
  ];

  const models = {
    'Mueller': ['Super Centurion', 'Centurion', 'A-423', 'A-423-NL'],
    'American Flow Control': ['Series 2500', 'Series 2000', 'American-BFV'],
    'Waterous': ['Pacer', 'Guardian', 'WB-67'],
    'Kennedy Valve': ['K-81', 'K-81-NL'],
    'Other': ['Custom', 'Unknown']
  };

  const updateField = (field, value) => {
    setHydrantData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Geocode address to lat/lon using Nominatim
  const geocodeAddress = async () => {
    setGeocodeLoading(true);
    setGeocodeError('');
    try {
      const query = encodeURIComponent(hydrantData.location_address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'HydrantHub/1.0 (tridentsys.ca)' } });
      const data = await resp.json();
      if (data.length === 0) {
        setGeocodeError('Address not found. Try a more complete or different address.');
      } else {
        const { lat, lon } = data[0];
        setHydrantData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
      }
    } catch (e) {
      setGeocodeError('Geocoding failed. Try again.');
    } finally {
      setGeocodeLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!hydrantData.hydrant_number.trim()) {
      newErrors.hydrant_number = 'Hydrant number is required';
    } else if (!/^[A-Z]{2,4}-\d{3,4}$/.test(hydrantData.hydrant_number.trim())) {
      newErrors.hydrant_number = 'Format: ABC-001 or ABCD-0001';
    }
    if (!hydrantData.manufacturer) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    if (!hydrantData.location_address.trim()) {
      newErrors.location_address = 'Address is required';
    }
    if (!hydrantData.latitude || hydrantData.latitude < 40 || hydrantData.latitude > 50) {
      newErrors.latitude = 'Invalid latitude for Ontario';
    }
    if (!hydrantData.longitude || hydrantData.longitude < -95 || hydrantData.longitude > -70) {
      newErrors.longitude = 'Invalid longitude for Ontario';
    }
    if (hydrantData.watermain_size_mm < 100 || hydrantData.watermain_size_mm > 600) {
      newErrors.watermain_size_mm = 'Size must be 100-600mm';
    }
    if (hydrantData.static_pressure_psi && (hydrantData.static_pressure_psi < 20 || hydrantData.static_pressure_psi > 150)) {
      newErrors.static_pressure_psi = 'Pressure should be 20-150 PSI';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const submitData = {
        ...hydrantData,
        installation_date: hydrantData.installation_date.format('YYYY-MM-DD'),
        static_pressure_psi: hydrantData.static_pressure_psi ? parseFloat(hydrantData.static_pressure_psi) : null,
        created_by: 'current_user',
        updated_by: 'current_user'
      };
      const response = await api.post('/hydrants', submitData);
      if (response.data.success) {
        navigate('/map', {
          state: {
            message: `Hydrant ${hydrantData.hydrant_number} created successfully!`,
            newHydrantId: response.data.hydrant.id
          }
        });
      }
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
        'Failed to create hydrant. Please check all fields and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setHydrantData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const generateHydrantNumber = () => {
    const prefix = 'MLT';
    const year = new Date().getFullYear();
    const sequence = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    const suggested = `${prefix}-${year}-${sequence}`;
    setHydrantData(prev => ({ ...prev, hydrant_number: suggested }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Add New Hydrant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register a new fire hydrant in the system with location and specifications
            </Typography>
          </div>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/map')}>Cancel</Button>
            <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Save Hydrant'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      {submitError && (<Alert severity="error" sx={{ mb: 3 }}>{submitError}</Alert>)}
      <Grid container spacing={3}>
        {/* Identification Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}><Business className="me-2" />Identification</Typography>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1}>
                  <TextField label="Hydrant Number *" value={hydrantData.hydrant_number} onChange={(e) => updateField('hydrant_number', e.target.value.toUpperCase())} error={!!errors.hydrant_number} helperText={errors.hydrant_number || 'Format: ABC-001 or ABCD-0001'} placeholder="MLT-2025-001" sx={{ flex: 1 }} />
                  <Button variant="outlined" onClick={generateHydrantNumber} sx={{ minWidth: 100 }}>Generate</Button>
                </Stack>
                <FormControl fullWidth error={!!errors.manufacturer}>
                  <InputLabel>Manufacturer *</InputLabel>
                  <Select value={hydrantData.manufacturer} onChange={(e) => { updateField('manufacturer', e.target.value); updateField('model', ''); }} label="Manufacturer *">
                    {manufacturers.map(mfg => (<MenuItem key={mfg} value={mfg}>{mfg}</MenuItem>))}
                  </Select>
                  {errors.manufacturer && (<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>{errors.manufacturer}</Typography>)}
                </FormControl>
                {hydrantData.manufacturer && (
                  <Autocomplete options={models[hydrantData.manufacturer] || []} value={hydrantData.model} onChange={(e, newValue) => updateField('model', newValue || '')} renderInput={(params) => (<TextField {...params} label="Model" placeholder="Select or type model" />)} freeSolo />
                )}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="Installation Date" value={hydrantData.installation_date} onChange={(newValue) => updateField('installation_date', newValue)} maxDate={dayjs()} renderInput={(params) => <TextField {...params} />} />
                </LocalizationProvider>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* Location Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}><LocationOn className="me-2" />Location</Typography>
              <Stack spacing={3}>
                <TextField label="Street Address *" value={hydrantData.location_address} onChange={(e) => updateField('location_address', e.target.value)} error={!!errors.location_address} helperText={errors.location_address || 'Full municipal address'} placeholder="123 Main Street, Milton, ON" fullWidth multiline />
                <Button variant="outlined" color="primary" startIcon={<Search />} onClick={geocodeAddress} disabled={geocodeLoading || !hydrantData.location_address} sx={{ alignSelf: 'flex-start' }}>Geocode Address</Button>
                {geocodeError && (<Typography variant="caption" color="error">{geocodeError}</Typography>)}
                <TextField label="Location Description" value={hydrantData.location_description} onChange={(e) => updateField('location_description', e.target.value)} placeholder="Northwest corner, near fire station entrance" fullWidth multiline rows={2} />
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="Latitude *" type="number" step="0.000001" value={hydrantData.latitude} onChange={(e) => updateField('latitude', parseFloat(e.target.value))} error={!!errors.latitude} helperText={errors.latitude} InputProps={{ startAdornment: (<InputAdornment position="start"><MyLocation /></InputAdornment>) }} fullWidth /></Grid>
                  <Grid item xs={6}><TextField label="Longitude *" type="number" step="0.000001" value={hydrantData.longitude} onChange={(e) => updateField('longitude', parseFloat(e.target.value))} error={!!errors.longitude} helperText={errors.longitude} fullWidth /></Grid>
                </Grid>
                <Button variant="outlined" startIcon={<MapIcon />} onClick={() => setShowMapPicker(true)} fullWidth>Pick Location on Map</Button>
                <Chip label={`${hydrantData.latitude.toFixed(6)}, ${hydrantData.longitude.toFixed(6)}`} variant="outlined" icon={<LocationOn />} sx={{ alignSelf: 'center' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* Technical Specifications */}
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}><Build className="me-2" />Specifications</Typography>
            <Stack spacing={3}>
              <TextField label="Watermain Size (mm) *" type="number" value={hydrantData.watermain_size_mm} onChange={(e) => updateField('watermain_size_mm', parseInt(e.target.value))} error={!!errors.watermain_size_mm} helperText={errors.watermain_size_mm || 'Common sizes: 150, 200, 250, 300mm'} InputProps={{ startAdornment: (<InputAdornment position="start"><Straighten /></InputAdornment>) }} fullWidth />
              <FormControl fullWidth><InputLabel>Operational Status</InputLabel><Select value={hydrantData.operational_status} onChange={(e) => updateField('operational_status', e.target.value)} label="Operational Status"><MenuItem value="OPERATIONAL">Operational</MenuItem><MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem><MenuItem value="MAINTENANCE_REQUIRED">Maintenance Required</MenuItem><MenuItem value="TESTING">Testing</MenuItem></Select></FormControl>
              <TextField label="Initial Static Pressure (PSI)" type="number" step="0.1" value={hydrantData.static_pressure_psi} onChange={(e) => updateField('static_pressure_psi', e.target.value)} error={!!errors.static_pressure_psi} helperText={errors.static_pressure_psi || 'Optional - if known from installation'} InputProps={{ startAdornment: (<InputAdornment position="start"><Opacity /></InputAdornment>) }} placeholder="72.5" fullWidth />
              <FormControl fullWidth><InputLabel>NFPA Classification</InputLabel><Select value={hydrantData.nfpa_classification} onChange={(e) => updateField('nfpa_classification', e.target.value)} label="NFPA Classification"><MenuItem value="">Unknown (will be determined by flow test)</MenuItem><MenuItem value="AA">Class AA (1500+ GPM)</MenuItem><MenuItem value="A">Class A (1000-1499 GPM)</MenuItem><MenuItem value="B">Class B (500-999 GPM)</MenuItem><MenuItem value="C">Class C (Under 500 GPM)</MenuItem></Select></FormControl>
            </Stack></CardContent></Card>
        </Grid>
        {/* Notes Section */}
        <Grid item xs={12} md={6}>
          <Card><CardContent><Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Additional Information</Typography><TextField label="Inspector Notes" value={hydrantData.inspector_notes} onChange={(e) => updateField('inspector_notes', e.target.value)} placeholder="Installation notes, special considerations, access requirements..." fullWidth multiline rows={6} /><Alert severity="info" sx={{ mt: 2 }}><Typography variant="body2"><strong>Next Steps:</strong> After saving, you can: • Record initial flow test (NFPA 291) • Schedule first maintenance inspection • Add photos and documentation</Typography></Alert></CardContent></Card>
        </Grid>
      </Grid>
      <MapPicker lat={hydrantData.latitude} lng={hydrantData.longitude} onLocationSelect={handleLocationSelect} open={showMapPicker} onClose={() => setShowMapPicker(false)} />
    </Box>
  );
}
