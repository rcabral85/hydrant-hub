import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Paper, Toolbar, TextField, InputAdornment, IconButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MapView from '../components/MapView';
import { listHydrants, createHydrant, updateHydrant, deleteHydrant } from '../services/api';

function classChip(nfpaClass) {
  const map = { 'AA': { label: 'Class AA', color: 'primary' }, 'A': { label: 'Class A', color: 'success' }, 'B': { label: 'Class B', color: 'warning' }, 'C': { label: 'Class C', color: 'error' } };
  const cfg = map[nfpaClass] || { label: 'Unknown', color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}

function HydrantForm({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial || { hydrant_number: '', address: '', lat: 43.5183, lon: -79.8687, hydrant_type: 'dry_barrel', outlet_2_5_inch_count: 2, status: 'active' });
  useEffect(() => { setForm(initial || { hydrant_number: '', address: '', lat: 43.5183, lon: -79.8687, hydrant_type: 'dry_barrel', outlet_2_5_inch_count: 2, status: 'active' }); }, [initial]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? 'Edit Hydrant' : 'Add Hydrant'}</DialogTitle>
      <DialogContent dividers>
        <TextField label="# Hydrant Number" value={form.hydrant_number} onChange={e => setForm({ ...form, hydrant_number: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <TextField label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} fullWidth sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Latitude" type="number" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} fullWidth />
          <TextField label="Longitude" type="number" value={form.lon} onChange={e => setForm({ ...form, lon: parseFloat(e.target.value) })} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(form)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
}

function Hydrants() {
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editInit, setEditInit] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listHydrants({ q: query, limit: 200 });
      setRows(res.data || []);
      if (!selected && res.data?.length) setSelected(res.data[0]);
    } catch (e) {
      console.error('Failed to load hydrants', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = rows; // server-side filtering already applied when using q

  const handleAdd = () => { setEditInit(null); setFormOpen(true); };
  const handleEdit = () => { if (selected) { setEditInit(selected); setFormOpen(true); } };
  const handleSave = async (payload) => {
    try {
      if (editInit) await updateHydrant(editInit.id, payload); else await createHydrant(payload);
      setFormOpen(false);
      await fetchData();
    } catch (e) {
      console.error('Save failed', e);
    }
  };
  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Delete ${selected.hydrant_number}?`)) return;
    try {
      await deleteHydrant(selected.id);
      setSelected(null);
      await fetchData();
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Toolbar sx={{ pl: 0 }}>
          <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>Hydrant Inventory</Typography>
          <TextField size="small" placeholder="Search hydrants" value={query} onChange={e => setQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchData(); }} />
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
          <Button variant="contained" onClick={handleAdd}>Add Hydrant</Button>
          <Button variant="outlined" disabled={!selected} onClick={handleEdit}>Edit</Button>
          <Button variant="outlined" color="error" disabled={!selected} onClick={handleDelete}>Delete</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 1, height: '80vh' }}>
        <MapView hydrants={filtered} selected={selected} onSelect={setSelected} />
      </Paper>

      <HydrantForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSave} initial={editInit} />
    </Box>
  );
}

export default Hydrants;
