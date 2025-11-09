import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Grid,
} from '@mui/material';
import { createValveInspection } from '../services/inspectionService';

const ValveInspectionForm = ({ hydrantId, onSuccess }) => {
  const [formData, setFormData] = useState({
    inspector: '',
    valveOperation: '',
    turnsToOpen: '',
    turnsToClose: '',
    leakage: '',
    pressure: '',
    flowRate: '',
    notes: '',
  });
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhotos(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createValveInspection(hydrantId, formData, photos);
      setFormData({
        inspector: '',
        valveOperation: '',
        turnsToOpen: '',
        turnsToClose: '',
        leakage: '',
        pressure: '',
        flowRate: '',
        notes: '',
      });
      setPhotos([]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Inspector Name"
            name
