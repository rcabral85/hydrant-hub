import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Paper, Typography, Chip, Stack, Alert } from '@mui/material';
import api from '../services/api';

const NFPA_COLORS = {
  AA: '#7e22ce', // purple
  A: '#16a34a',  // green
  B: '#f59e0b',  // orange
  C: '#ef4444',  // red
};

const DEFAULT_CENTER = [
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT || 43.5890),
  parseFloat(import.meta.env.VITE_DEFAULT_MAP_CENTER_LON || -79.6441),
];

const DEFAULT_ZOOM = parseInt(import.meta.env.VITE_DEFAULT_MAP_ZOOM || '12', 10);

function Legend() {
  return (
    <Paper elevation={1} sx={{ position: 'absolute', top: 16, right: 16, p: 1.5 }}>
      <Typography variant="subtitle2" gutterBottom>NFPA Classes</Typography>
      <Stack direction="column" spacing={0.5}>
        {['AA','A','B','C'].map(cls => (
          <Stack key={cls} direction="row" spacing={1} alignItems="center">
            <span style={{ width: 12, height: 12, backgroundColor: NFPA_COLORS[cls], borderRadius: '50%' }} />
            <Typography variant="caption">{cls}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default function HydrantMap() {
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/hydrants/map/geojson');
        setGeo(res.data.geojson);
      } catch (e) {
        setError(e.response?.data || e.message);
      }
    })();
  }, []);

  const features = useMemo(() => geo?.features || [], [geo]);

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 80px)' }}>
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1000 }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </Alert>
      )}

      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {features.map((f) => {
          if (!f?.geometry?.coordinates) return null;
          const [lon, lat] = f.geometry.coordinates;
          const cls = f.properties?.nfpa_class || 'C';
          const color = NFPA_COLORS[cls] || NFPA_COLORS.C;
          return (
            <CircleMarker
              key={f.properties.id}
              center={[lat, lon]}
              radius={8}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}
            >
              <Popup>
                <Typography variant="subtitle2">Hydrant {f.properties.hydrant_number}</Typography>
                <Typography variant="body2">{f.properties.address || 'No address'}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={`Class ${cls}`} />
                  {f.properties.available_flow_gpm && (
                    <Chip size="small" label={`${f.properties.available_flow_gpm} GPM`} color="primary" />
                  )}
                </Stack>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <Legend />
    </Box>
  );
}
