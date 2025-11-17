// HydrantHub - Add New Hydrant Component
// Patch: Ensure address reliably autofills after location pick
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
    latitude: 43.5182,
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

  // Updated to reliably await address on map location pick
  const reverseGeocode = async (lat, lng) => {
    setLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'HydrantHub/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setHydrantData(prev => ({ ...prev, location_address: data.display_name }));
      } else {
        setHydrantData(prev => ({ ...prev, location_address: '' }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setHydrantData(prev => ({ ...prev, location_address: '' }));
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleLocationSelect = async (lat, lng) => {
    setHydrantData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    await reverseGeocode(lat, lng); // Await to ensure autofill
  };

  // ...The rest remains unchanged...
