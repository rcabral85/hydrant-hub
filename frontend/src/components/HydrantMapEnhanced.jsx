import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box, Paper, Typography, Chip, Stack, Alert, Drawer, Card, CardContent,
  Button, Fab, IconButton, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Badge, Divider, Tooltip
} from '@mui/material';
import {
  Add, Close, Edit, Timeline, Build, LocationOn, Refresh,
  PlayArrow, Assessment, CheckCircle, Warning
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';
import FlowTestQuickModal from './FlowTestQuickModal';
import MaintenanceQuickModal from './MaintenanceQuickModal';

const NFPA_COLORS = {
  AA: '#7e22ce', // purple - excellent
  A: '#16a34a',  // green - good
  B: '#f59e0b',  // orange - adequate  
  C: '#ef4444',  // red - poor
  OUT_OF_SERVICE: '#6b7280', // gray
  MAINTENANCE_REQUIRED: '#dc2626' // red
};

const DEFAULT_CENTER = [
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || 43.5182),
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LON || -79.8774),
];

const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM || '12', 10);

function Legend() {
  return (
    <Paper elevation={3} sx={{ position: 'absolute', top: 80, right: 16, p: 2, zIndex: 1000 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>NFPA Classes</Typography>
      <Stack direction="column" spacing={1}>
        {[
          { key: 'AA', label: 'Class AA (1500+ GPM)', desc: 'Excellent' },
          { key: 'A', label: 'Class A (1000-1499 GPM)', desc: 'Good' },
          { key: 'B', label: 'Class B (500-999 GPM)', desc: 'Adequate' },
          { key: 'C', label: 'Class C (<500 GPM)', desc: 'Poor' },
          { key: 'OUT_OF_SERVICE', label: 'Out of Service', desc: 'Inactive' }
        ].map(item => (
          <Stack key={item.key} direction="row" spacing={1} alignItems="center">
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: NFPA_COLORS[item.key], 
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.2)'
              }} 
            />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>{item.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {item.desc}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

// Component for handling map clicks in add mode
function MapClickHandler({ addMode, onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      if (addMode) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function HydrantMapEnhanced() {
  const navigate = useNavigate();
  const location = useLocation();
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState(null);
  const [selectedHydrant, setSelectedHydrant] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState(0);
  const [addMode, setAddMode] = useState(false);
  const [flowTestModal, setFlowTestModal] = useState(false);
  const [maintenanceModal, setMaintenanceModal] = useState(false);
  const [hydrantDetails, setHydrantDetails] = useState(null);
  const [flowTests, setFlowTests] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  useEffect(() => {
    loadMapData();
    
    // Check for success message from Add Hydrant
    if (location.state?.message) {
      setTimeout(() => {
        alert(location.state.message);
      }, 1000);
    }
  }, [location.state]);

  const loadMapData = async () => {
    try {
      const res = await api.get('/hydrants/map/geojson');
      setGeo(res.data.geojson);
    } catch (e) {
      console.log('GeoJSON not available, loading regular hydrant data');
      try {
        // Fallback to regular hydrant data and convert to GeoJSON format
        const hydrantRes = await api.get('/hydrants');
        const hydrants = hydrantRes.data.hydrants || [];
        
        const geojson = {
          type: 'FeatureCollection',
          features: hydrants.map(hydrant => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [hydrant.longitude || -79.8774, hydrant.latitude || 43.5182]
            },
            properties: {
              id: hydrant.id,
              hydrant_number: hydrant.hydrant_number,
              address: hydrant.address || hydrant.location_address,
              location_address: hydrant.location_address,
              nfpa_class: hydrant.nfpa_class || hydrant.nfpa_classification,
              operational_status: hydrant.operational_status || hydrant.status,
              flow_rate_gpm: hydrant.flow_rate_gpm,
              static_pressure_psi: hydrant.static_pressure_psi,
              manufacturer: hydrant.manufacturer,
              model: hydrant.model,
              watermain_size_mm: hydrant.watermain_size_mm,
              installation_date: hydrant.installation_date,
              last_flow_test_date: hydrant.last_flow_test_date,
              last_inspection_date: hydrant.last_inspection_date
            }
          }))
        };
        
        setGeo(geojson);
      } catch (fallbackError) {
        setError('Unable to load hydrant data');
      }
    }
  };

  const loadHydrantDetails = async (hydrantId) => {
    try {
      // Load hydrant details
      const hydrantRes = await api.get(`/hydrants/${hydrantId}`);
      setHydrantDetails(hydrantRes.data.hydrant);
      
      // Load recent flow tests
      try {
        const flowRes = await api.get(`/flow-tests?hydrant_id=${hydrantId}&limit=5`);
        setFlowTests(flowRes.data.flowTests || []);
      } catch (flowError) {
        console.log('Flow test data not available');
        setFlowTests([]);
      }
      
      // Load maintenance history (mock data for now)
      setMaintenanceHistory([
        {
          id: 1,
          type: 'INSPECTION',
          date: '2025-09-15',
          status: 'PASS',
          inspector: 'Rich Cabral',
          notes: 'Annual inspection completed - excellent condition'
        },
        {
          id: 2,
          type: 'FLOW_TEST', 
          date: '2025-09-15',
          status: 'AA',
          inspector: 'Rich Cabral',
          notes: '2,347 GPM - Class AA performance'
        }
      ]);
      
    } catch (error) {
      console.error('Error loading hydrant details:', error);
    }
  };

  const handleMarkerClick = (feature) => {
    if (addMode) return; // Don't open drawer in add mode
    
    setSelectedHydrant(feature);
    setDrawerOpen(true);
    setDrawerTab(0);
    loadHydrantDetails(feature.properties.id);
  };

  const handleLocationSelect = (lat, lng) => {
    navigate('/hydrants/new', {
      state: { 
        latitude: lat, 
        longitude: lng,
        fromMap: true
      }
    });
  };

  const handleFlowTestSuccess = (flowTest) => {
    setFlowTests(prev => [flowTest, ...prev]);
    loadMapData(); // Refresh map with updated data
  };

  const handleMaintenanceSuccess = (inspection) => {
    setMaintenanceHistory(prev => [inspection, ...prev]);
    loadMapData(); // Refresh map with updated status
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPERATIONAL': 'success',
      'OUT_OF_SERVICE': 'error',
      'MAINTENANCE_REQUIRED': 'warning',
      'TESTING': 'info'
    };
    return colors[status] || 'default';
  };

  const features = useMemo(() => geo?.features || [], [geo]);

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1000, maxWidth: 400 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%' }}
      >
        <MapClickHandler addMode={addMode} onLocationSelect={handleLocationSelect} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {features.map((f) => {
          if (!f?.geometry?.coordinates) return null;
          const [lon, lat] = f.geometry.coordinates;
          const cls = f.properties?.nfpa_class || f.properties?.nfpa_classification || 'C';
          const status = f.properties?.operational_status || f.properties?.status || 'OPERATIONAL';
          
          // Choose color based on status first, then NFPA class
          const color = status === 'OUT_OF_SERVICE' ? NFPA_COLORS.OUT_OF_SERVICE :
                       status === 'MAINTENANCE_REQUIRED' ? NFPA_COLORS.MAINTENANCE_REQUIRED :
                       NFPA_COLORS[cls] || NFPA_COLORS.C;
          
          return (
            <CircleMarker
              key={f.properties.id}
              center={[lat, lon]}
              radius={10}
              pathOptions={{ 
                color: color, 
                fillColor: color, 
                fillOpacity: 0.8,
                weight: 2,
                className: 'hydrant-marker'
              }}
              eventHandlers={{
                click: () => handleMarkerClick(f)
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {f.properties.hydrant_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {f.properties.address || f.properties.location_address || 'No address'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip size="small" label={`Class ${cls}`} color="primary" />
                    <Chip size="small" label={status} color={getStatusColor(status)} />
                  </Stack>
                  
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button size="small" onClick={() => handleMarkerClick(f)}>
                      View Details
                    </Button>
                  </Stack>
                </Box>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <Legend />

      {/* Add Hydrant FAB */}
      <Stack 
        spacing={1}
        sx={{ 
          position: 'absolute', 
          bottom: 20, 
          right: 20, 
          zIndex: 1000 
        }}
      >
        <Tooltip title={addMode ? "Click map to add hydrant" : "Add new hydrant"}>
          <Fab 
            color={addMode ? "secondary" : "primary"}
            onClick={() => setAddMode(!addMode)}
          >
            <Add />
          </Fab>
        </Tooltip>
        
        <Tooltip title="Refresh map data">
          <Fab 
            size="small"
            onClick={loadMapData}
          >
            <Refresh />
          </Fab>
        </Tooltip>
      </Stack>

      {/* Add Mode Indicator */}
      {addMode && (
        <Paper 
          elevation={3} 
          sx={{ 
            position: 'absolute', 
            top: 20, 
            left: '50%', 
            transform: 'translateX(-50%)',
            p: 2, 
            zIndex: 1000,
            bgcolor: 'secondary.main',
            color: 'white'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📍 Add Hydrant Mode Active
          </Typography>
          <Typography variant="body2">
            Click anywhere on the map to place a new hydrant
          </Typography>
          <Button 
            size="small" 
            sx={{ mt: 1, color: 'white', borderColor: 'white' }}
            variant="outlined"
            onClick={() => setAddMode(false)}
          >
            Cancel Add Mode
          </Button>
        </Paper>
      )}

      {/* Hydrant Details Drawer */}
      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        {selectedHydrant && (
          <Box sx={{ p: 2 }}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {selectedHydrant.properties.hydrant_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedHydrant.properties.address || selectedHydrant.properties.location_address}
                </Typography>
              </div>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Stack>

            {/* Status Chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap>
              <Chip 
                label={`Class ${selectedHydrant.properties.nfpa_class || selectedHydrant.properties.nfpa_classification || 'TBD'}`}
                color="primary"
              />
              <Chip 
                label={selectedHydrant.properties.operational_status || selectedHydrant.properties.status || 'Operational'}
                color={getStatusColor(selectedHydrant.properties.operational_status || selectedHydrant.properties.status)}
              />
              {selectedHydrant.properties.flow_rate_gpm && (
                <Chip 
                  label={`${selectedHydrant.properties.flow_rate_gpm} GPM`}
                  variant="outlined"
                />
              )}
            </Stack>

            {/* Quick Actions */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
                <Stack spacing={1}>
                  <Button 
                    variant="contained" 
                    startIcon={<Timeline />}
                    onClick={() => setFlowTestModal(true)}
                    fullWidth
                  >
                    Record Flow Test
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<Build />}
                    onClick={() => setMaintenanceModal(true)}
                    color="secondary"
                    fullWidth
                  >
                    Record Maintenance
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<Edit />}
                    onClick={() => navigate(`/hydrants/${selectedHydrant.properties.id}/edit`)}
                    fullWidth
                  >
                    Edit Hydrant
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={drawerTab} 
                onChange={(e, newValue) => setDrawerTab(newValue)}
                variant="fullWidth"
              >
                <Tab label="Overview" />
                <Tab label="Flow Tests" />
                <Tab label="Maintenance" />
              </Tabs>
            </Box>

            <TabPanel value={drawerTab} index={0}>
              {hydrantDetails ? (
                <Stack spacing={2}>
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                    <Typography variant="body2">
                      <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                      {hydrantDetails.latitude?.toFixed(6)}, {hydrantDetails.longitude?.toFixed(6)}
                    </Typography>
                    <Typography variant="body2">{hydrantDetails.location_description}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Specifications</Typography>
                    <Typography variant="body2">Manufacturer: {hydrantDetails.manufacturer}</Typography>
                    <Typography variant="body2">Model: {hydrantDetails.model}</Typography>
                    <Typography variant="body2">Watermain: {hydrantDetails.watermain_size_mm}mm</Typography>
                    <Typography variant="body2">Installed: {dayjs(hydrantDetails.installation_date).format('MMM DD, YYYY')}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="subtitle2" color="text.secondary">Last Readings</Typography>
                    <Typography variant="body2">Static Pressure: {hydrantDetails.static_pressure_psi || 'TBD'} PSI</Typography>
                    <Typography variant="body2">Flow Rate: {hydrantDetails.flow_rate_gpm || 'TBD'} GPM</Typography>
                    <Typography variant="body2">Last Test: {hydrantDetails.last_flow_test_date ? dayjs(hydrantDetails.last_flow_test_date).format('MMM DD, YYYY') : 'Never'}</Typography>
                    <Typography variant="body2">Last Inspection: {hydrantDetails.last_inspection_date ? dayjs(hydrantDetails.last_inspection_date).format('MMM DD, YYYY') : 'Never'}</Typography>
                  </div>
                </Stack>
              ) : (
                <Typography>Loading hydrant details...</Typography>
              )}
            </TabPanel>

            <TabPanel value={drawerTab} index={1}>
              <Stack spacing={2}>
                <div>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Flow Tests</Typography>
                    <Button size="small" startIcon={<Add />} onClick={() => setFlowTestModal(true)}>
                      New Test
                    </Button>
                  </Stack>
                </div>
                
                {flowTests.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Flow (GPM)</TableCell>
                          <TableCell>Class</TableCell>
                          <TableCell>Pressure</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {flowTests.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>{dayjs(test.test_date).format('MMM DD')}</TableCell>
                            <TableCell>{test.total_flow_gpm || test.flow_rate_gpm}</TableCell>
                            <TableCell>
                              <Chip 
                                label={test.nfpa_class || test.nfpa_classification}
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                            <TableCell>{test.static_pressure_psi} PSI</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No flow tests recorded. Click "Record Flow Test" to add the first test.
                  </Alert>
                )}
              </Stack>
            </TabPanel>

            <TabPanel value={drawerTab} index={2}>
              <Stack spacing={2}>
                <div>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Maintenance History</Typography>
                    <Button size="small" startIcon={<Add />} onClick={() => setMaintenanceModal(true)}>
                      New Inspection
                    </Button>
                  </Stack>
                </div>
                
                {maintenanceHistory.length > 0 ? (
                  <Stack spacing={1}>
                    {maintenanceHistory.map((item) => (
                      <Paper key={item.id} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <div>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.type.replace('_', ' ')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {dayjs(item.date).format('MMM DD, YYYY')} by {item.inspector}
                            </Typography>
                            <Typography variant="body2">{item.notes}</Typography>
                          </div>
                          <Chip 
                            label={item.status}
                            color={item.status === 'PASS' || item.status === 'AA' ? 'success' : 
                                   item.status === 'CONDITIONAL' ? 'warning' : 'error'}
                            size="small"
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="info">
                    No maintenance inspections recorded. Click "Record Maintenance" to add the first inspection.
                  </Alert>
                )}
              </Stack>
            </TabPanel>
          </Box>
        )}
      </Drawer>

      {/* Flow Test Quick Modal */}
      <FlowTestQuickModal
        open={flowTestModal}
        onClose={() => setFlowTestModal(false)}
        hydrant={selectedHydrant?.properties}
        onSuccess={handleFlowTestSuccess}
      />

      {/* Maintenance Quick Modal */}
      <MaintenanceQuickModal
        open={maintenanceModal}
        onClose={() => setMaintenanceModal(false)}
        hydrant={selectedHydrant?.properties}
        onSuccess={handleMaintenanceSuccess}
      />
    </Box>
  );
}

function Legend() {
  return (
    <Paper elevation={3} sx={{ position: 'absolute', top: 80, right: 16, p: 2, zIndex: 1000 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>NFPA Classes</Typography>
      <Stack direction="column" spacing={1}>
        {[
          { key: 'AA', label: 'Class AA (1500+ GPM)', desc: 'Excellent' },
          { key: 'A', label: 'Class A (1000-1499 GPM)', desc: 'Good' },
          { key: 'B', label: 'Class B (500-999 GPM)', desc: 'Adequate' },
          { key: 'C', label: 'Class C (<500 GPM)', desc: 'Poor' },
          { key: 'OUT_OF_SERVICE', label: 'Out of Service', desc: 'Inactive' }
        ].map(item => (
          <Stack key={item.key} direction="row" spacing={1} alignItems="center">
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: NFPA_COLORS[item.key], 
                borderRadius: '50%',
                border: '1px solid rgba(0,0,0,0.2)'
              }} 
            />
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 500 }}>{item.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {item.desc}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}