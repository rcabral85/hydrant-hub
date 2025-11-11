import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Container, Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('hydrantHub_token');
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setUsers(res.data.users))
      .catch(e => setError(e.response?.data?.error || 'Failed to load users'));
    axios.get('/api/admin/organizations', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setOrganizations(res.data.organizations))
      .catch(e => setError(e.response?.data?.error || 'Failed to load organizations'));
    setLoading(false);
  }, [user]);

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">You must be an admin to access this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={600} mb={2}>Admin Dashboard</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Users" />
          <Tab label="Organizations" />
        </Tabs>
        {error && <Alert severity="error">{error}</Alert>}
        {loading && <CircularProgress />}
        {!loading && tab === 0 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>Org Type</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.first_name} {u.last_name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.organization_name}</TableCell>
                  <TableCell>{u.organization_type}</TableCell>
                  <TableCell>{u.created_at && new Date(u.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && tab === 1 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Org ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Contact Email</TableCell>
                <TableCell>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map(o => (
                <TableRow key={o.id}>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.name}</TableCell>
                  <TableCell>{o.type}</TableCell>
                  <TableCell>{o.contact_email}</TableCell>
                  <TableCell>{o.created_at && new Date(o.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}

export default AdminDashboard;
