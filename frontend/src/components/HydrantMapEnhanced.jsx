import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, CircleMarker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Box, Paper, Typography, Chip, Stack, Alert, Drawer, Card, CardContent,
  Button, Fab, IconButton, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip, useMediaQuery, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import {
  Add, Close, Edit, Timeline, Build, Refresh, Layers, MyLocation
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';
import FlowTestQuickModal from './FlowTestQuickModal';
import MaintenanceQuickModal from './MaintenanceQuickModal';

// NFPA 291 Colors
const NFPA_COLORS = {
  AA: '#0000FF',
  A: '#00FF00',
  B: '#FFA500',
  C: '#FF0000',
};

// Work Status Colors
const WORK_STATUS_COLORS = {
  COMPLIANT: '#10b981',
  DUE_SOON: '#f59e0b',
  OVERDUE: '#ef4444',
  NEEDS_MAINTENANCE: '#dc2626',
  OUT_OF_SERVICE: '#6b7280',
};

const DEFAULT_CENTER = [
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || 43.5182),
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LON || -79.8774),
];

const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM || '12', 10);

function Legend({ mapView, isMobile }) {
  return (
    <Paper elevation={3} sx={{ position: 'absolute', top: isMobile ? 70 : 80, right: 16, p: 2, zIndex: 1000, maxWidth: 240 }}>
      {mapView === 'nfpa' ? (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>NFPA 291 Flow Classes</Typography>
          <Stack direction="column" spacing={1}>
            {[
              { key: 'AA', label: 'Class AA', desc: '≥1500 GPM' },
              { key: 'A', label: 'Class A', desc: '1000-1499 GPM' },
              { key: 'B', label: 'Class B', desc: '500-999 GPM' },
              { key: 'C', label: 'Class C', desc: '<500 GPM' },
            ].map(item => (
              <Stack key={item.key} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 16, height: 16, backgroundColor: NFPA_COLORS[item.key], borderRadius: '50%', border: '1px solid rgba(0,0,0,0.2)' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{item.desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </>
      ) : (
        <>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Work Status</Typography>
          <Stack direction="column" spacing={1}>
            {[
              { key: 'COMPLIANT', label: 'Compliant', desc: 'Up to date' },
              { key: 'DUE_SOON', label: 'Due Soon', desc: 'Within 30 days' },
              { key: 'OVERDUE', label: 'Overdue', desc: 'Past due date' },
              { key: 'NEEDS_MAINTENANCE', label: 'Needs Work', desc: 'Maintenance required' },
              { key: 'OUT_OF_SERVICE', label: 'Out of Service', desc: 'Not operational' },
            ].map(item => (
              <Stack key={item.key} direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 16, height: 16, backgroundColor: WORK_STATUS_COLORS[item.key], borderRadius: '50%', border: '1px solid rgba(0,0,0,0.2)' }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{item.desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}

function MapClickHandler({ addMode, onLocationSelect }) {
  useMapEvents({ click: (e) => { if (addMode) onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

// Component to handle map centering on user location
function LocationCenter({ position, shouldCenter }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && shouldCenter) {
      map.flyTo([position.lat, position.lng], 16, {
        duration: 1.5
      });
    }
  }, [position, shouldCenter, map]);
  
  return null;
}

function HydrantInfoPopup({ feature, onFlowTest, onMaintenance, onEdit }) {
  const props = feature?.properties || {};
  const cls = props.nfpa_class || props.nfpa_classification || 'C';
  const status = props.operational_status || props.status || 'OPERATIONAL';
  return (
    <Box sx={{ minWidth: 220 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{props.hydrant_number}</Typography>
      <Typography variant="body2" color="text.secondary">{props.address || props.location_address || 'No address'}</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap>
        <Chip size="small" label={`Class ${cls}`} color={{AA:'primary',A:'success',B:'warning',C:'error'}[cls] || 'default'} />
        <Chip size="small" label={status} color={{OPERATIONAL:'success',OUT_OF_SERVICE:'error',MAINTENANCE_REQUIRED:'warning',TESTING:'info'}[status] || 'default'} />
      </Stack>
      {props.flow_rate_gpm && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Flow Rate: {props.flow_rate_gpm} GPM</Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button size="small" variant="contained" onClick={onFlowTest}>Flow Test</Button>
        <Button size="small" variant="outlined" onClick={onMaintenance}>Maintenance</Button>
        <Button size="small" onClick={onEdit}>Edit</Button>
      </Stack>
    </Box>
  );
}

function getWorkStatus(hydrant) {
  const props = hydrant.properties;
  
  if (props.operational_status === 'OUT_OF_SERVICE' || props.status === 'out_of_service') {
    return 'OUT_OF_SERVICE';
  }
  
  if (props.operational_status === 'MAINTENANCE_REQUIRED' || props.status === 'maintenance_required') {
    return 'NEEDS_MAINTENANCE';
  }
  
  const lastTestDate = props.last_flow_test_date || props.last_inspection_date;
  if (!lastTestDate) {
    return 'OVERDUE';
  }
  
  const daysSinceTest = dayjs().diff(dayjs(lastTestDate), 'day');
  
  if (daysSinceTest > 365) {
    return 'OVERDUE';
  } else if (daysSinceTest > 335) {
    return 'DUE_SOON';
  }
  
  return 'COMPLIANT';
}

export default function HydrantMapEnhanced() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

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
  const [mapView, setMapView] = useState('nfpa'); // 'nfpa' or 'work'
  
  // Geolocation state
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locating, setLocating] = useState(false);
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(false);

  useEffect(() => {
    loadMapData();
    if (location.state?.message) setTimeout(() => alert(location.state.message), 1000);
  }, [location.state]);

  const loadMapData = async () => {
    try {
      const res = await api.get('/hydrants/map/geojson');
      setGeo(res.data.geojson);
    } catch (e) {
      try {
        const hydrantRes = await api.get('/hydrants');
        const hydrants = hydrantRes.data.hydrants || [];
        const geojson = {
          type: 'FeatureCollection',
          features: hydrants.map(h => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [h.longitude || -79.8774, h.latitude || 43.5182] },
            properties: {
              id: h.id,
              hydrant_number: h.hydrant_number,
              address: h.address || h.location_address,
              location_address: h.location_address,
              nfpa_class: h.nfpa_class || h.nfpa_classification || (h.flow_rate_gpm >= 1500 ? 'AA' : h.flow_rate_gpm >= 1000 ? 'A' : h.flow_rate_gpm >= 500 ? 'B' : 'C'),
              operational_status: h.operational_status || h.status,
              flow_rate_gpm: h.flow_rate_gpm,
              static_pressure_psi: h.static_pressure_psi,
              manufacturer: h.manufacturer,
              model: h.model,
              watermain_size_mm: h.watermain_size_mm,
              installation_date: h.installation_date,
              last_flow_test_date: h.last_flow_test_date,
              last_inspection_date: h.last_inspection_date
            }
          }))
        };
        setGeo(geojson);
      } catch { setError('Unable to load hydrant data'); }
    }
  };

  const loadHydrantDetails = async (hydrantId) => {
    try {
      const hydrantRes = await api.get(`/hydrants/${hydrantId}`);
      setHydrantDetails(hydrantRes.data.hydrant);
      try {
        const flowRes = await api.get(`/flow-tests?hydrant_id=${hydrantId}&limit=5`);
        setFlowTests(flowRes.data.flowTests || []);
      } catch { setFlowTests([]); }
      setMaintenanceHistory([]);
    } catch {}
  };

  const handleMarkerClick = (feature) => {
    setSelectedHydrant(feature);
    setDrawerOpen(true);
    setDrawerTab(0);
    loadHydrantDetails(feature.properties.id);
  };

  // Get user's current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        });
        setShouldCenterOnUser(true);
        setLocating(false);
        
        // Reset centering flag after animation
        setTimeout(() => setShouldCenterOnUser(false), 2000);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location access in your browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred while getting location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const features = useMemo(() => geo?.features || [], [geo]);
  const markerRadius = isMobile ? 8 : 10;

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
      {/* Map View Toggle */}
      <Paper elevation={3} sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}>
        <ToggleButtonGroup
          value={mapView}
          exclusive
          onChange={(e, value) => value && setMapView(value)}
          size="small"
        >
          <ToggleButton value="nfpa">
            <Layers sx={{ mr: 0.5, fontSize: 18 }} />
            NFPA Classification
          </ToggleButton>
          <ToggleButton value="work">
            <Build sx={{ mr: 0.5, fontSize: 18 }} />
            Work Status
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 80, left: 16, zIndex: 1000, maxWidth: 400 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      {locationError && (
        <Alert 
          severity="warning" 
          onClose={() => setLocationError(null)}
          sx={{ position: 'absolute', top: error ? 140 : 80, left: 16, zIndex: 1000, maxWidth: 400 }}
        >
          {locationError}
        </Alert>
      )}

      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <MapClickHandler addMode={addMode} onLocationSelect={(lat,lng)=>navigate('/hydrants/new',{state:{latitude:lat,longitude:lng,fromMap:true}})} />
        <LocationCenter position={userLocation} shouldCenter={shouldCenterOnUser} />
        
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer attribution='&copy; Google Maps' url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* User location marker and accuracy circle */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{
                color: '#4285F4',
                fillColor: '#4285F4',
                fillOpacity: 0.1,
                weight: 1
              }}
            />
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              radius={8}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: '#4285F4',
                fillOpacity: 1,
                weight: 3
              }}
            >
              <Popup>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Your Location</Typography>
                  <Typography variant="caption" display="block">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontSize: 10 }}>
                    Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                  </Typography>
                </Box>
              </Popup>
            </CircleMarker>
          </>
        )}

        {features.map((f) => {
          if (!f?.geometry?.coordinates) return null;
          const [lon, lat] = f.geometry.coordinates;
          const props = f.properties;
          
          let color;
          if (mapView === 'nfpa') {
            const cls = props?.nfpa_class || props?.nfpa_classification || 'C';
            color = NFPA_COLORS[cls] || NFPA_COLORS.C;
          } else {
            const workStatus = getWorkStatus(f);
            color = WORK_STATUS_COLORS[workStatus];
          }

          return (
            <CircleMarker key={props.id} center={[lat, lon]} radius={markerRadius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 2 }}
              eventHandlers={{ click: () => handleMarkerClick(f) }}>
              <Popup closeButton>
                <HydrantInfoPopup
                  feature={f}
                  onFlowTest={() => { setSelectedHydrant(f); setFlowTestModal(true); }}
                  onMaintenance={() => { setSelectedHydrant(f); setMaintenanceModal(true); }}
                  onEdit={() => navigate(`/hydrants/${props.id}/edit`)}
                />
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <Legend mapView={mapView} isMobile={isMobile} />

      <Stack spacing={1} sx={{ position: 'absolute', bottom: isMobile ? 80 : 20, right: 20, zIndex: 1000 }}>
        <Tooltip title={addMode ? 'Click map to add hydrant' : 'Add new hydrant'}>
          <Fab color={addMode ? 'secondary' : 'primary'} onClick={() => setAddMode(!addMode)} aria-label="add hydrant">
            <Add />
          </Fab>
        </Tooltip>
        <Tooltip title={userLocation ? 'Update my location' : 'Find my location'}>
          <Fab 
            size="small" 
            onClick={handleGetLocation} 
            disabled={locating}
            aria-label="my location"
            color={userLocation ? 'info' : 'default'}
          >
            <MyLocation />
          </Fab>
        </Tooltip>
        <Tooltip title="Refresh map data">
          <Fab size="small" onClick={loadMapData} aria-label="refresh map">
            <Refresh />
          </Fab>
        </Tooltip>
      </Stack>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        {selectedHydrant && (
          <Box sx={{ p: isMobile ? 1.5 : 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: isMobile ? 18 : 22 }}>{selectedHydrant.properties.hydrant_number}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedHydrant.properties.address || selectedHydrant.properties.location_address}</Typography>
              </div>
              <IconButton onClick={() => setDrawerOpen(false)} aria-label="close details"><Close /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap>
              <Chip label={`Class ${selectedHydrant.properties.nfpa_class || selectedHydrant.properties.nfpa_classification || 'TBD'}`} color={{AA:'primary',A:'success',B:'warning',C:'error'}[selectedHydrant.properties.nfpa_class || selectedHydrant.properties.nfpa_classification] || 'default'} />
              <Chip label={selectedHydrant.properties.operational_status || selectedHydrant.properties.status || 'Operational'} color={{OPERATIONAL:'success',OUT_OF_SERVICE:'error',MAINTENANCE_REQUIRED:'warning',TESTING:'info'}[selectedHydrant.properties.operational_status || selectedHydrant.properties.status] || 'default'} />
              {selectedHydrant.properties.flow_rate_gpm && (<Chip label={`${selectedHydrant.properties.flow_rate_gpm} GPM`} variant="outlined" />)}
            </Stack>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontSize: isMobile ? 16 : 18 }}>Quick Actions</Typography>
                <Stack spacing={1}>
                  <Button variant="contained" startIcon={<Timeline />} onClick={() => setFlowTestModal(true)} fullWidth>Record Flow Test</Button>
                  <Button variant="contained" startIcon={<Build />} onClick={() => setMaintenanceModal(true)} color="secondary" fullWidth>Record Maintenance</Button>
                  <Button variant="outlined" startIcon={<Edit />} onClick={() => navigate(`/hydrants/${selectedHydrant.properties.id}/edit`)} fullWidth>Edit Hydrant</Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        )}
      </Drawer>

      <FlowTestQuickModal open={flowTestModal} onClose={() => setFlowTestModal(false)} hydrant={selectedHydrant?.properties} onSuccess={(ft)=>{setFlowTests(prev=>[ft,...prev]); loadMapData();}} />
      <MaintenanceQuickModal open={maintenanceModal} onClose={() => setMaintenanceModal(false)} hydrant={selectedHydrant?.properties} onSuccess={(insp)=>{setMaintenanceHistory(prev=>[insp,...prev]); loadMapData();}} />
    </Box>
  );
}