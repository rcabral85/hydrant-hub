import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Toolbar, TextField, InputAdornment, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Button, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MapView from '../components/MapView';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const classes = [
  { key: 'AA', label: 'Class AA', color: 'primary' },
  { key: 'A', label: 'Class A', color: 'success' },
  { key: 'B', label: 'Class B', color: 'warning' },
  { key: 'C', label: 'Class C', color: 'error' },
];

function HydrantClassChip({ value }) {
  const cfg = classes.find(c => c.key === value);
  return <Chip label={cfg ? cfg.label : 'Unknown'} color={cfg ? cfg.color : 'default'} size="small" />;
}

function FlowTests() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // Demo data placeholder
    const demo = [
      { id: 101, hydrant_number: 'H-001', test_date: '2025-06-10', static_pressure_psi: 75, residual_pressure_psi: 55, total_flow_gpm: 2226, available_flow_20psi_gpm: 3402, nfpa_classification: 'AA', lat: 43.5183, lon: -79.8687 },
    ];
    setRows(demo);
    setSelected(demo[0]);
    setLoading(false);
  }, []);

  const filtered = rows.filter(r =>
    r.hydrant_number.toLowerCase().includes(query.toLowerCase()) ||
    (r.test_date || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Toolbar sx={{ pl: 0 }}>
          <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Flow Tests</Typography>
          <TextField size="small" placeholder="Search" value={query} onChange={e => setQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }} />
        </Toolbar>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hydrant</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Static</TableCell>
                <TableCell align="right">Residual</TableCell>
                <TableCell align="right">Total Flow</TableCell>
                <TableCell align="right">Avail at 20 PSI</TableCell>
                <TableCell>Class</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} hover selected={selected?.id === r.id} onClick={() => setSelected(r)}>
                  <TableCell>{r.hydrant_number}</TableCell>
                  <TableCell>{r.test_date}</TableCell>
                  <TableCell align="right">{r.static_pressure_psi}</TableCell>
                  <TableCell align="right">{r.residual_pressure_psi}</TableCell>
                  <TableCell align="right">{r.total_flow_gpm}</TableCell>
                  <TableCell align="right">{r.available_flow_20psi_gpm}</TableCell>
                  <TableCell><HydrantClassChip value={r.nfpa_classification} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />}>New Flow Test</Button>
          <Button variant="outlined" disabled={!selected}>View Details</Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1, height: '80vh' }}>
        <MapView hydrants={filtered.map(r => ({ id: r.id, hydrant_number: r.hydrant_number, address: r.hydrant_address, nfpa_class: r.nfpa_classification, available_flow_gpm: r.available_flow_20psi_gpm, lat: r.lat, lon: r.lon }))} selected={selected && { lat: selected.lat, lon: selected.lon }} onSelect={() => {}} />
      </Paper>
    </Box>
  );
}

export default FlowTests;
