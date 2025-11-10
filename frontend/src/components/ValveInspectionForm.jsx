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
            name="inspector"
            value={formData.inspector}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Valve Operation</InputLabel>
            <Select
              name="valveOperation"
              value={formData.valveOperation}
              onChange={handleChange}
              label="Valve Operation"
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="OPENS">Opens</MenuItem>
              <MenuItem value="CLOSES">Closes</MenuItem>
              <MenuItem value="NA">N/A</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Turns to Open"
            name="turnsToOpen"
            value={formData.turnsToOpen}
            onChange={handleChange}
            type="number"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Turns to Close"
            name="turnsToClose"
            value={formData.turnsToClose}
            onChange={handleChange}
            type="number"
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Leakage (Visible?)"
            name="leakage"
            value={formData.leakage}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Pressure (PSI)"
            name="pressure"
            value={formData.pressure}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Flow Rate (GPM)"
            name="flowRate"
            value={formData.flowRate}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Additional Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            component="label"
            fullWidth
          >
            Upload Photos
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Inspection'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ValveInspectionForm;
