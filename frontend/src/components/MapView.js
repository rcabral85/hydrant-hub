import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const nfpaColors = {
  AA: '#0066CC', // Blue
  A: '#00AA00',  // Green
  B: '#FF8800',  // Orange
  C: '#CC0000'   // Red
};

function FocusMap({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 16, { duration: 0.75 });
    }
  }, [lat, lon]);
  return null;
}

function MapView({ hydrants = [], selected, onSelect }) {
  const center = selected ? [selected.lat, selected.lon] : [43.5183, -79.8687];

  return (
    <MapContainer center={center} zoom={15} style={{ height: '100%', minHeight: '70vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {hydrants.map(h => (
        <Marker key={h.id} position={[h.lat, h.lon]} eventHandlers={{ click: () => onSelect && onSelect(h) }}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>{h.hydrant_number}</strong><br />
              {h.address}<br />
              <span style={{ color: nfpaColors[h.nfpa_class] || '#444' }}>Class {h.nfpa_class}</span><br />
              {h.available_flow_gpm ? `${h.available_flow_gpm.toLocaleString()} GPM` : 'No flow data'}
            </div>
          </Popup>
        </Marker>
      ))}
      {selected && <FocusMap lat={selected.lat} lon={selected.lon} />}
    </MapContainer>
  );
}

export default MapView;
