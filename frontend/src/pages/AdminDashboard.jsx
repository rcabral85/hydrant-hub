import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Container,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add as AddIcon, ContentCopy as CopyIcon, Email as EmailIcon } from '@mui/icons-material';
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

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'operator'
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const handleInviteUser = async () => {
    setInviteLoading(true);
    const token = localStorage.getItem('hydrantHub_token');

    try {
      const response = await axios.post(
        `${API_URL}/users/invite`,
        inviteForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInviteLink(response.data.inviteLink);
      setSnackbar({
        open: true,
        message: 'Invitation sent successfully!',
        severity: 'success'
      });

      // Refresh users list
      const usersRes = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);

    } catch (e) {
      setSnackbar({
        open: true,
        message: e.response?.data?.error || 'Failed to send invitation',
        severity: 'error'
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setSnackbar({
      open: true,
      message: 'Invitation link copied to clipboard!',
      severity: 'success'
    });
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteForm({ email: '', first_name: '', last_name: '', role: 'operator' });
    setInviteLink('');
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <div>
            <Typography variant="h4" fontWeight={600}>Admin Dashboard</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Logged in as: {user.email} (Superadmin)
            </Typography>
          </div>
          {tab === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setInviteDialogOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Invite User
            </Button>
          )}
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label={`Users (${users.length})`} />
          <Tab label={`Organizations (${organizations.length})`} />
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
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.first_name} {u.last_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.role}
                          size="small"
                          color={u.is_superadmin ? 'error' : u.role === 'admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? 'Active' : 'Pending'}
                          size="small"
                          color={u.is_active ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{u.organization_name}</TableCell>
                      <TableCell>{u.created_at && new Date(u.created_at).toLocaleDateString()}</TableCell>
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
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Contact Email</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {organizations.map(o => (
                    <TableRow key={o.id}>
                      <TableCell>{o.name}</TableCell>
                      <TableCell><Chip label={o.type} size="small" /></TableCell>
                      <TableCell>{o.contact_email}</TableCell>
                      <TableCell>{o.created_at && new Date(o.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Paper>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            <Typography variant="h6">Invite New User</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!inviteLink ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
              <TextField
                label="First Name"
                fullWidth
                value={inviteForm.first_name}
                onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                required
              />
              <TextField
                label="Last Name"
                fullWidth
                value={inviteForm.last_name}
                onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={inviteForm.role}
                  label="Role"
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                >
                  <MenuItem value="operator">Operator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Invitation created successfully!
              </Alert>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Share this link with the user to complete their registration:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 2, position: 'relative' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', pr: 5 }}>
                  {inviteLink}
                </Typography>
                <Tooltip title="Copy link">
                  <IconButton
                    size="small"
                    onClick={handleCopyLink}
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Note: Email functionality is not yet configured. Please share this link manually.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteDialog}>
            {inviteLink ? 'Close' : 'Cancel'}
          </Button>
          {!inviteLink && (
            <Button
              onClick={handleInviteUser}
              variant="contained"
              disabled={inviteLoading || !inviteForm.email || !inviteForm.first_name || !inviteForm.last_name}
            >
              {inviteLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default AdminDashboard;
