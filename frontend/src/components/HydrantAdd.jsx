// HydrantHub - Add New Hydrant Component
// Updated to use HYD-### format and minimal required fields
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Alert, Paper,
  Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Autocomplete, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import {
  Save, Cancel, LocationOn, Map as MapIcon, MyLocation, Business,
  DateRange, Build, Straighten, Opacity
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapPicker = ({ lat, lng, onLocationSelect, open, onClose }) => {
  const [selectedLat, setSelectedLat] = useState(lat || 43.5182);
  const [selectedLng, setSelectedLng] = useState(lng || -79.8774);

  useEffect(() => {
    setSelectedLat(lat || 43.5182);
    setSelectedLng(lng || -79.8774);
  }, [lat, lng]);

  const handleMapClick = (newLat, newLng) => {
    setSelectedLat(newLat);
    setSelectedLng(newLng);
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLat, selectedLng);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Select Hydrant Location</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on the map to select a location. The address will be automatically filled.
        </Typography>
        <Box sx={{ height: 400, mb: 2 }}>
          {open && (
            <MapContainer
              center={[selectedLat, selectedLng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[selectedLat, selectedLng]} />
              <MapClickHandler onLocationSelect={handleMapClick} />
            </MapContainer>
          )}
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Latitude"
              type="number"
              step="0.000001"
              value={selectedLat}
              onChange={(e) => setSelectedLat(parseFloat(e.target.value))}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Longitude"
              type="number"
              step="0.000001"
              value={selectedLng}
              onChange={(e) => setSelectedLng(parseFloat(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Confirm Location
        </Button>
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
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [hydrantData, setHydrantData] = useState({
    hydrant_number: '',
    manufacturer: '',
    model: '',
    installation_date: null,
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

  useEffect(() => {
    // Get user's current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHydrantData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
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

  const validateForm = () => {
    const newErrors = {};
    
    // Only 3 fields are mandatory: hydrant_number, manufacturer, and location_address
    if (!hydrantData.hydrant_number.trim()) {
      newErrors.hydrant_number = 'Hydrant number is required';
    } else if (!/^HYD-\d{3,4}$/.test(hydrantData.hydrant_number.trim())) {
      newErrors.hydrant_number = 'Format must be HYD-001 or HYD-0001';
    }
    
    if (!hydrantData.manufacturer) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (!hydrantData.location_address.trim()) {
      newErrors.location_address = 'Address is required';
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
        hydrant_number: hydrantData.hydrant_number,
        manufacturer: hydrantData.manufacturer,
        location_address: hydrantData.location_address,
        latitude: hydrantData.latitude,
        longitude: hydrantData.longitude,
        // Optional fields - only include if provided
        ...(hydrantData.model && { model: hydrantData.model }),
        ...(hydrantData.installation_date && { installation_date: hydrantData.installation_date.format('YYYY-MM-DD') }),
        ...(hydrantData.location_description && { location_description: hydrantData.location_description }),
        ...(hydrantData.watermain_size_mm && { watermain_size_mm: parseInt(hydrantData.watermain_size_mm) }),
        ...(hydrantData.static_pressure_psi && { static_pressure_psi: parseFloat(hydrantData.static_pressure_psi) }),
        ...(hydrantData.operational_status && { operational_status: hydrantData.operational_status }),
        ...(hydrantData.nfpa_classification && { nfpa_classification: hydrantData.nfpa_classification }),
        ...(hydrantData.inspector_notes && { inspector_notes: hydrantData.inspector_notes }),
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

  // Reverse geocode coordinates to address with async/await fix
  const reverseGeocode = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HydrantHub/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        const address = data.display_name;
        setHydrantData(prev => ({ ...prev, location_address: address }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setHydrantData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    // Await to ensure address fills immediately
    await reverseGeocode(lat, lng);
  };

  // Generate hydrant number in HYD-### format
  const generateHydrantNumber = async () => {
    try {
      // Fetch existing hydrants to get the highest number
      const response = await api.get('/hydrants?limit=1000');
      const hydrants = response.data.hydrants || [];
      
      // Filter for HYD-### format and extract numbers
      const hydNumbers = hydrants
        .map(h => h.hydrant_number)
        .filter(num => /^HYD-\d+$/.test(num))
        .map(num => parseInt(num.replace('HYD-', '')))
        .filter(num => !isNaN(num));
      
      // Get the next number
      const nextNumber = hydNumbers.length > 0 ? Math.max(...hydNumbers) + 1 : 1;
      const suggested = `HYD-${String(nextNumber).padStart(3, '0')}`;
      
      setHydrantData(prev => ({ ...prev, hydrant_number: suggested }));
    } catch (error) {
      console.error('Failed to generate hydrant number:', error);
      // Fallback to random number if API call fails
      const randomNum = Math.floor(Math.random() * 999) + 1;
      const suggested = `HYD-${String(randomNum).padStart(3, '0')}`;
      setHydrantData(prev => ({ ...prev, hydrant_number: suggested }));
    }
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
            <Chip 
              label="Only Hydrant Number, Manufacturer, and Address are required" 
              color="info" 
              size="small" 
              sx={{ mt: 1 }}
            />
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
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                <Business sx={{ mr: 1 }} />Identification *
              </Typography>
              <Stack spacing={3}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Hydrant Number *"
                    value={hydrantData.hydrant_number}
                    onChange={(e) => updateField('hydrant_number', e.target.value.toUpperCase())}
                    error={!!errors.hydrant_number}
                    helperText={errors.hydrant_number || 'Format: HYD-001, HYD-002, etc.'}
                    placeholder="HYD-001"
                    sx={{ flex: 1 }}
                    required
                  />
                  <Button variant="outlined" onClick={generateHydrantNumber} sx={{ minWidth: 100 }}>Generate</Button>
                </Stack>
                <FormControl fullWidth error={!!errors.manufacturer} required>
                  <InputLabel>Manufacturer *</InputLabel>
                  <Select
                    value={hydrantData.manufacturer}
                    onChange={(e) => {
                      updateField('manufacturer', e.target.value);
                      updateField('model', '');
                    }}
                    label="Manufacturer *"
                  >
                    {manufacturers.map(mfg => (<MenuItem key={mfg} value={mfg}>{mfg}</MenuItem>))}
                  </Select>
                  {errors.manufacturer && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                      {errors.manufacturer}
                    </Typography>
                  )}
                </FormControl>
                {hydrantData.manufacturer && (
                  <Autocomplete
                    options={models[hydrantData.manufacturer] || []}
                    value={hydrantData.model}
                    onChange={(e, newValue) => updateField('model', newValue || '')}
                    renderInput={(params) => (
                      <TextField {...params} label="Model (Optional)" placeholder="Select or type model" />
                    )}
                    freeSolo
                  />
                )}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Installation Date (Optional)"
                    value={hydrantData.installation_date}
                    onChange={(newValue) => updateField('installation_date', newValue)}
                    maxDate={dayjs()}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </LocalizationProvider>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* Location Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                <LocationOn sx={{ mr: 1 }} />Location *
              </Typography>
              <Stack spacing={3}>
                <TextField
                  label="Street Address *"
                  value={hydrantData.location_address}
                  onChange={(e) => updateField('location_address', e.target.value)}
                  error={!!errors.location_address}
                  helperText={errors.location_address || 'Full municipal address'}
                  placeholder="123 Main Street, Milton, ON"
                  fullWidth
                  multiline
                  required
                  InputProps={{
                    endAdornment: loadingAddress && (
                      <InputAdornment position="end">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  label="Location Description (Optional)"
                  value={hydrantData.location_description}
                  onChange={(e) => updateField('location_description', e.target.value)}
                  placeholder="Northwest corner, near fire station entrance"
                  fullWidth
                  multiline
                  rows={2}
                />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      label="Latitude"
                      type="number"
                      step="0.000001"
                      value={hydrantData.latitude}
                      onChange={(e) => updateField('latitude', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MyLocation />
                          </InputAdornment>
                        )
                      }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Longitude"
                      type="number"
                      step="0.000001"
                      value={hydrantData.longitude}
                      onChange={(e) => updateField('longitude', parseFloat(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={() => setShowMapPicker(true)}
                  fullWidth
                >
                  Pick Location on Map (Auto-fills Address)
                </Button>
                <Chip
                  label={`${hydrantData.latitude.toFixed(6)}, ${hydrantData.longitude.toFixed(6)}`}
                  variant="outlined"
                  icon={<LocationOn />}
                  sx={{ alignSelf: 'center' }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* Technical Specifications (All Optional) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                <Build sx={{ mr: 1 }} />Specifications (Optional)
              </Typography>
              <Stack spacing={3}>
                <TextField
                  label="Watermain Size (mm)"
                  type="number"
                  value={hydrantData.watermain_size_mm}
                  onChange={(e) => updateField('watermain_size_mm', parseInt(e.target.value))}
                  helperText="Common sizes: 150, 200, 250, 300mm"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Straighten />
                      </InputAdornment>
                    )
                  }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Operational Status</InputLabel>
                  <Select
                    value={hydrantData.operational_status}
                    onChange={(e) => updateField('operational_status', e.target.value)}
                    label="Operational Status"
                  >
                    <MenuItem value="OPERATIONAL">Operational</MenuItem>
                    <MenuItem value="OUT_OF_SERVICE">Out of Service</MenuItem>
                    <MenuItem value="MAINTENANCE_REQUIRED">Maintenance Required</MenuItem>
                    <MenuItem value="TESTING">Testing</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Initial Static Pressure (PSI)"
                  type="number"
                  step="0.1"
                  value={hydrantData.static_pressure_psi}
                  onChange={(e) => updateField('static_pressure_psi', e.target.value)}
                  helperText="Optional - if known from installation"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Opacity />
                      </InputAdornment>
                    )
                  }}
                  placeholder="72.5"
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>NFPA Classification</InputLabel>
                  <Select
                    value={hydrantData.nfpa_classification}
                    onChange={(e) => updateField('nfpa_classification', e.target.value)}
                    label="NFPA Classification"
                  >
                    <MenuItem value="">Unknown (will be determined by flow test)</MenuItem>
                    <MenuItem value="AA">Class AA (1500+ GPM)</MenuItem>
                    <MenuItem value="A">Class A (1000-1499 GPM)</MenuItem>
                    <MenuItem value="B">Class B (500-999 GPM)</MenuItem>
                    <MenuItem value="C">Class C (Under 500 GPM)</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* Notes Section (Optional) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Additional Information (Optional)</Typography>
              <TextField
                label="Inspector Notes"
                value={hydrantData.inspector_notes}
                onChange={(e) => updateField('inspector_notes', e.target.value)}
                placeholder="Installation notes, special considerations, access requirements..."
                fullWidth
                multiline
                rows={6}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Next Steps:</strong> After saving, you can:
                  <br />• Record initial flow test (NFPA 291)
                  <br />• Schedule first maintenance inspection
                  <br />• Add photos and documentation
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <MapPicker
        lat={hydrantData.latitude}
        lng={hydrantData.longitude}
        onLocationSelect={handleLocationSelect}
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
      />
    </Box>
  );
}