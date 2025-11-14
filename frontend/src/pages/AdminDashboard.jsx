import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Container, Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('hydrantHub_token');
      
      // Check if user is superadmin
      if (!user || !user.is_superadmin) {
        setError('Superadmin access required');
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Fetch users
        const usersRes = await axios.get(`${API_URL}/admin/users`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Users response:', usersRes.data);
        setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      } catch (e) {
        console.error('Error loading users:', e);
        setError(e.response?.data?.error || 'Failed to load users');
        setUsers([]);
      }

      try {
        // Fetch organizations
        const orgsRes = await axios.get(`${API_URL}/admin/organizations`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log('Organizations response:', orgsRes.data);
        setOrganizations(Array.isArray(orgsRes.data?.organizations) ? orgsRes.data.organizations : []);
      } catch (e) {
        console.error('Error loading organizations:', e);
        setError(e.response?.data?.error || 'Failed to load organizations');
        setOrganizations([]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Check if user is superadmin
  if (!isAuthenticated || !user || !user.is_superadmin) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">You must be a superadmin to access this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 3 }}>
        <Typography variant="h4" fontWeight={600} mb={2}>Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Logged in as: {user.email} (Superadmin)
        </Typography>
        
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Users" />
          <Tab label="Organizations" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}

        {!loading && tab === 0 && (
          <>
            {users.length === 0 && !error ? (
              <Typography>No users found.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Superadmin</TableCell>
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
                      <TableCell>{u.is_superadmin ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{u.organization_name}</TableCell>
                      <TableCell>{u.organization_type}</TableCell>
                      <TableCell>{u.created_at && new Date(u.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {!loading && tab === 1 && (
          <>
            {organizations.length === 0 && !error ? (
              <Typography>No organizations found.</Typography>
            ) : (
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
          </>
        )}
      </Paper>
    </Container>
  );
}

export default AdminDashboard;
