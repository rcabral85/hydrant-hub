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
import { getInspectionsByHydrant, getWorkOrders, updateWorkOrder } from '../services/inspectionService';
import InspectionList from '../components/InspectionList';
import InspectionForm from '../components/InspectionForm';
import WorkOrderCard from '../components/WorkOrderCard';

function Inspections() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [hydrants, setHydrants] = useState([]);
  const [selectedHydrant, setSelectedHydrant] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    loadHydrants();
  }, []);

  useEffect(() => {
    if (selectedHydrant) {
      loadInspectionsAndWorkOrders();
    }
  }, [selectedHydrant]);

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

  const loadInspectionsAndWorkOrders = async () => {
    try {
      setLoadingData(true);
      const [inspectionsData, workOrdersData] = await Promise.all([
        getInspectionsByHydrant(selectedHydrant),
        getWorkOrders(selectedHydrant)
      ]);
      setInspections(inspectionsData || []);
      setWorkOrders(workOrdersData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load inspection data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleHydrantChange = (event) => {
    setSelectedHydrant(event.target.value);
    setSelectedTab(0);
  };

  const handleInspectionCreated = () => {
    loadInspectionsAndWorkOrders();
    setSelectedTab(0);
  };

  const handleWorkOrderUpdate = async (workOrderId, updates) => {
    try {
      await updateWorkOrder(workOrderId, updates);
      loadInspectionsAndWorkOrders();
    } catch (err) {
      setError('Failed to update work order');
    }
  };

  if (loading) return React.createElement('div', {style:{display:'flex',justifyContent:'center',marginTop:32}}, React.createElement(CircularProgress));
  
    return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

      {selectedHydrant ? (
        <Box>
          {selectedTab === 0 && (
            <InspectionList
              hydrantId={selectedHydrant}
              inspections={inspections}
              loading={loadingData}
              error={error}
              onViewDetails={(inspection) => console.log('View:', inspection)}
              onGeneratePdf={(inspection) => console.log('PDF:', inspection)}
            />
          )}
          {selectedTab === 1 && (
            <InspectionForm
              hydrantId={selectedHydrant}
              onInspectionCreated={handleInspectionCreated}
            />
          )}
          {selectedTab === 2 && (
            <Box>
              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : workOrders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No work orders found for this hydrant
                  </Typography>
                </Paper>
              ) : (
                workOrders.map((wo) => (
                  <WorkOrderCard
                    key={wo._id}
                    workOrder={wo}
                    onUpdate={handleWorkOrderUpdate}
                  />
                ))
              )}
            </Box>
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
