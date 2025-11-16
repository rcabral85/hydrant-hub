// HydrantHub Maintenance Management Page
// Material-UI styled maintenance dashboard for the production app
// Complete maintenance workflow integration

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, LinearProgress, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, TextField, IconButton, Divider, useMediaQuery
} from '@mui/material';
import {
  Build, Warning, CheckCircle, Schedule, Add, FilterList,
  PictureAsPdf, PlayArrow
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import dayjs from 'dayjs';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [hydrants, setHydrants] = useState([]);
  const [error, setError] = useState(null);
  const [newInspectionDialog, setNewInspectionDialog] = useState(false);
  const [selectedHydrant, setSelectedHydrant] = useState('');
  
  // Real data from API
  const [inspections, setInspections] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, scheduled: 0, in_progress: 0, completed: 0 });
  const [complianceSchedule, setComplianceSchedule] = useState([]);

  useEffect(() => {
    loadMaintenanceData();
    loadHydrants();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data (compliance/schedule endpoint disabled for now)
const [inspectionsRes, workOrdersRes, statsRes] = await Promise.all([
  api.get('/maintenance/inspections'),
  api.get('/maintenance/work-orders'),
  api.get('/maintenance/stats')
]);

// Mock empty compliance data since endpoint is disabled
const complianceRes = { data: { schedule: [], total: 0 } };

      
      setInspections(inspectionsRes.data || []);
      setWorkOrders(workOrdersRes.data || []);
      setStats(statsRes.data || { total: 0, scheduled: 0, in_progress: 0, completed: 0 });
      setComplianceSchedule(complianceRes.data || []);
      
    } catch (error) {
      console.error('Error loading maintenance data:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setError(`Failed to load maintenance data: ${errorMsg}. Please check your connection and try refreshing.`);
    } finally {
      setLoading(false);
    }
  };

  const loadHydrants = async () => {
    try {
      const response = await api.get('/hydrants');
      setHydrants(response.data.hydrants || []);
    } catch (error) {
      console.error('Error loading hydrants:', error);
    }
  };

  const getPriorityColor = (priority) => ({ 'LOW': 'default', 'NORMAL': 'primary', 'MEDIUM': 'warning', 'HIGH': 'error', 'CRITICAL': 'error' }[priority] || 'default');
  const getStatusColor = (status) => ({ 'PASS': 'success', 'FAIL': 'error', 'CONDITIONAL': 'warning', 'SCHEDULED': 'info', 'IN_PROGRESS': 'primary', 'COMPLETED': 'success', 'EXCELLENT': 'success' }[status] || 'default');
  const getProgressColor = (progress) => (progress === 100 ? 'success' : progress >= 60 ? 'primary' : progress >= 25 ? 'warning' : 'error');

  const startInspection = (hydrant) => { navigate(`/maintenance/inspect/${hydrant.hydrant_number}`); };
  const handleNewInspection = () => { setNewInspectionDialog(true); };
  const createNewInspection = () => {
    if (selectedHydrant) {
      const hydrant = hydrants.find(h => h.id === selectedHydrant);
      if (hydrant) navigate(`/maintenance/inspect/${hydrant.hydrant_number}`);
      setNewInspectionDialog(false);
      setSelectedHydrant('');
    }
  };

  const generateReport = () => { console.log('Generating maintenance compliance report...'); };

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>Maintenance Management</Typography>
          <Typography variant="body2" color="text.secondary">Preventive maintenance, compliance tracking & audit management</Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FilterList />}>Filters</Button>
          <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={generateReport}>Export Report</Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleNewInspection}>New Inspection</Button>
        </Stack>
      </Stack>

      {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Build color="primary" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{stats.total || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Records</Typography>
                <Typography variant="caption" color="primary.main">All maintenance</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Schedule color="info" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{stats.scheduled || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Scheduled</Typography>
                <Typography variant="caption" color="info.main">Upcoming work</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Warning color="warning" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{stats.in_progress || 0}</Typography>
                <Typography variant="body2" color="text.secondary">In Progress</Typography>
                <Typography variant="caption" color="warning.main">Active now</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CheckCircle color="success" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{stats.completed || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Completed</Typography>
                <Typography variant="caption" color="success.main">Finished work</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} variant={isMobile ? 'fullWidth' : 'standard'}>
            <Tab label="Upcoming Inspections" />
            <Tab label="Active Work Orders" />
            <Tab label="Recent Activity" />
            <Tab label="Compliance Status" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Typography variant="h6" sx={{ mb: 2 }}>Inspections Due (Next 30 Days)</Typography>
          <div className="table-scroll-x">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Hydrant</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Inspection Type</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Last Inspection</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspections.map((inspection) => (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{inspection.hydrant_number}</Typography>
                        {inspection.regulatory_required && (<Chip label="Required" size="small" color="info" sx={{ width: 'fit-content' }} />)}
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{inspection.location}</Typography></TableCell>
                    <TableCell>{inspection.inspection_type}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{dayjs(inspection.due_date).format('MMM DD, YYYY')}</Typography>
                      {dayjs(inspection.due_date).isBefore(dayjs()) && (<Chip label="OVERDUE" size="small" color="error" sx={{ mt: 0.5 }} />)}
                    </TableCell>
                    <TableCell><Chip label={inspection.priority} color={getPriorityColor(inspection.priority)} size="small" /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{dayjs(inspection.last_inspection).format('MMM DD, YYYY')}</Typography></TableCell>
                    <TableCell><Button size="small" variant="contained" startIcon={<PlayArrow />} onClick={() => startInspection(inspection)}>Start</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Typography variant="h6" sx={{ mb: 2 }}>Active Work Orders</Typography>
          <div className="table-scroll-x">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>WO #</TableCell>
                  <TableCell>Hydrant</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{wo.id}</Typography></TableCell>
                    <TableCell>{wo.hydrant_number}</TableCell>
                    <TableCell><Typography variant="body2">{wo.title}</Typography><Typography variant="caption" color="text.secondary">{wo.category.replace('_', ' ')}</Typography></TableCell>
                    <TableCell><Chip label={wo.priority} color={getPriorityColor(wo.priority)} size="small" /></TableCell>
                    <TableCell><Chip label={wo.status} color={getStatusColor(wo.status)} size="small" /></TableCell>
                    <TableCell>
                      <Box sx={{ width: 80 }}>
                        <LinearProgress variant="determinate" value={wo.progress} color={getProgressColor(wo.progress)} sx={{ height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7em' }}>{wo.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{wo.assigned_to}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{dayjs(wo.target_date).format('MMM DD, YYYY')}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>${wo.estimated_cost}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Maintenance Activity</Typography>
          <Stack spacing={2}>
            {inspections.slice(0, 5).map((activity) => (
              <Paper key={activity.id} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{activity.type ? activity.type.replace('_', ' ') : 'Activity'} - {activity.hydrant_number}</Typography>
                    <Typography variant="body2" color="text.secondary">{activity.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{activity.date && dayjs(activity.date).format('MMM DD, YYYY')} {activity.inspector && `by ${activity.inspector}`}</Typography>
                  </div>
                  <Chip label={activity.status} color={getStatusColor(activity.status)} size="small" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" sx={{ mb: 2 }}>Regulatory Compliance Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card><CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Ontario Regulation 169/03</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Annual Inspections</Typography><Chip label="Pending" color="warning" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Documentation Complete</Typography><Chip label="In Progress" color="info" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Audit Trail</Typography><Chip label="Active" color="success" size="small" /></Stack>
                </Stack>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card><CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>NFPA 291 Flow Testing</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Flow Tests Current</Typography><Chip label="Pending" color="warning" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Calculation Accuracy</Typography><Chip label="Verified" color="success" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Report Generation</Typography><Chip label="Automated" color="success" size="small" /></Stack>
                </Stack>
              </CardContent></Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      <Dialog open={newInspectionDialog} onClose={() => setNewInspectionDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Start New Inspection</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Hydrant</InputLabel>
              <Select value={selectedHydrant} onChange={(e) => setSelectedHydrant(e.target.value)} label="Select Hydrant">
                {hydrants.map((hydrant) => (
                  <MenuItem key={hydrant.id} value={hydrant.id}>{hydrant.hydrant_number} - {hydrant.address || hydrant.location_address || 'No address'}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewInspectionDialog(false)}>Cancel</Button>
          <Button onClick={createNewInspection} variant="contained" disabled={!selectedHydrant}>Start Inspection</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}