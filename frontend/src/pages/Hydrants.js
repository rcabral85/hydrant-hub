import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Toolbar, TextField, InputAdornment, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapView from '../components/MapView';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

function classChip(nfpaClass) {
  const map = {
    'AA': { label: 'Class AA', color: 'primary' },
    'A': { label: 'Class A', color: 'success' },
    'B': { label: 'Class B', color: 'warning' },
    'C': { label: 'Class C', color: 'error' },
  };
  const cfg = map[nfpaClass] || { label: 'Unknown', color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

function Hydrants() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Demo data until API endpoint is wired
    const demo = [
      { id: 1, hydrant_number: 'H-001', address: '123 Main St, Milton', nfpa_class: 'AA', available_flow_gpm: 1600, lat: 43.5183, lon: -79.8687 },
      { id: 2, hydrant_number: 'H-002', address: '125 Main St, Milton', nfpa_class: 'A', available_flow_gpm: 1200, lat: 43.5185, lon: -79.8690 },
      { id: 3, hydrant_number: 'H-003', address: '129 Main St, Milton', nfpa_class: 'B', available_flow_gpm: 800, lat: 43.5188, lon: -79.8682 },
    ];
    setRows(demo);
    setSelected(demo[0]);
    setLoading(false);
  }, []);

  const filtered = rows.filter(r =>
    r.hydrant_number.toLowerCase().includes(query.toLowerCase()) ||
    r.address.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Toolbar sx={{ pl: 0 }}>
          <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Hydrant Inventory</Typography>
          <TextField size="small" placeholder="Search hydrants" value={query} onChange={e => setQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
        </Toolbar>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>NFPA Class</TableCell>
                <TableCell align="right">Avail Flow (GPM)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} hover selected={selected?.id === r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer' }}>
                  <TableCell>{r.hydrant_number}</TableCell>
                  <TableCell>{r.address}</TableCell>
                  <TableCell>{classChip(r.nfpa_class)}</TableCell>
                  <TableCell align="right">{r.available_flow_gpm?.toLocaleString() ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button variant="contained">Add Hydrant</Button>
          <Button variant="outlined" disabled={!selected}>Edit</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 1, height: '80vh' }}>
        <MapView hydrants={filtered} selected={selected} onSelect={setSelected} />
      </Paper>
    </Box>
  );
}

export default Hydrants;
