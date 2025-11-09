// frontend/src/pages/Inspections.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Assignment as AssignmentIcon } from '@mui/icons-material';
import { listHydrants } from '../services/api';

function Inspections() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [hydrants, setHydrants] = useState([]);
  const [selectedHydrant, setSelectedHydrant] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHydrants();
  }, []);

  const loadHydrants = async () => {
    try {
      setLoading(true);
      const result = await listHydrants({ limit: 1000 });
      if (result && result.hydrants) {
        setHydrants(result.hydrants);
      }
    } catch (err) {
      console.error('Error loading hydrants:', err);
      setError('Failed to load hydrants');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleHydrantChange = (event) => {
    setSelectedHydrant(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AssignmentIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Inspection Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Hydrant Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Hydrant</InputLabel>
          <Select
            value={selectedHydrant}
            label="Select Hydrant"
            onChange={handleHydrantChange}
          >
            <MenuItem value="">
              <em>Choose a hydrant...</em>
            </MenuItem>
            {hydrants.map((hydrant) => (
              <MenuItem key={hydrant.id} value={hydrant.id}>
                {hydrant.hydrant_number} - {hydrant.location_address || 'No address'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Tab Navigation */}
      {selectedHydrant && (
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Inspection History" />
            <Tab label="New Inspection" />
            <Tab label="Work Orders" />
          </Tabs>
        </Paper>
      )}

      {/* Tab Content */}
      {selectedHydrant ? (
        <Box>
          {selectedTab === 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Inspection History
              </Typography>
              <Typography color="text.secondary">
                Inspection list component will be displayed here.
                Hydrant ID: {selectedHydrant}
              </Typography>
            </Paper>
          )}

          {selectedTab === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                New Inspection
              </Typography>
              <Typography color="text.secondary">
                Inspection form component will be displayed here.
                Hydrant ID: {selectedHydrant}
              </Typography>
            </Paper>
          )}

          {selectedTab === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Work Orders
              </Typography>
              <Typography color="text.secondary">
                Work orders component will be displayed here.
                Hydrant ID: {selectedHydrant}
              </Typography>
            </Paper>
          )}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a hydrant to view or create inspections
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Choose a hydrant from the dropdown above to get started
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default Inspections;
