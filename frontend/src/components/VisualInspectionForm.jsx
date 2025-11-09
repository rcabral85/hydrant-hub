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
import { createVisualInspection } from '../services/inspectionService';

const VisualInspectionForm = ({ hydrantId, onSuccess }) => {
  const [formData, setFormData] = useState({
    inspector: '',
    overallCondition: '',
    capCondition: '',
    outletCondition: '',
    paintCondition: '',
    signage: '',
    accessibility: '',
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
      await createVisualInspection(hydrantId, formData, photos);
      setFormData({
        inspector: '',
        overallCondition: '',
        capCondition: '',
        outletCondition: '',
        paintCondition: '',
        signage: '',
        accessibility: '',
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
            <InputLabel>Overall Condition</InputLabel>
            <Select
              name="overallCondition"
              value={formData.overallCondition}
              label="Overall Condition"
              onChange={handleChange}
            >
              <MenuItem value="Excellent">Excellent</MenuItem>
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Fair">Fair</MenuItem>
              <MenuItem value="Poor">Poor</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Cap Condition</InputLabel>
            <Select
              name="capCondition"
              value={formData.capCondition}
              label="Cap Condition"
              onChange={handleChange}
            >
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Damaged">Damaged</MenuItem>
              <MenuItem value="Missing">Missing</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Outlet Condition</InputLabel>
            <Select
              name="outletCondition"
              value={formData.outletCondition}
              label="Outlet Condition"
              onChange={handleChange}
            >
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Damaged">Damaged</MenuItem>
              <MenuItem value="Leaking">Leaking</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Paint Condition</InputLabel>
            <Select
              name="paintCondition"
              value={formData.paintCondition}
              label="Paint Condition"
              onChange={handleChange}
            >
              <MenuItem value="Good">Good</MenuItem>
              <MenuItem value="Faded">Faded</MenuItem>
              <MenuItem value="Peeling">Peeling</MenuItem>
              <MenuItem value="Needs Repainting">Needs Repainting</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Signage</InputLabel>
            <Select
              name="signage"
              value={formData.signage}
              label="Signage"
              onChange={handleChange}
            >
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Missing">Missing</MenuItem>
              <MenuItem value="Damaged">Damaged</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Accessibility</InputLabel>
            <Select
              name="accessibility"
              value={formData.accessibility}
              label="Accessibility"
              onChange={handleChange}
            >
              <MenuItem value="Clear">Clear</MenuItem>
              <MenuItem value="Partially Obstructed">Partially Obstructed</MenuItem>
              <MenuItem value="Obstructed">Obstructed</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="outlined" component="label" fullWidth>
            Upload Photos
            <input
              type="file"
              hidden
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          {photos.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {photos.length} file(s) selected
            </Typography>
          )}
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit Visual Inspection'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VisualInspectionForm;
