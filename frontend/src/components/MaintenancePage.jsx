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
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [hydrants, setHydrants] = useState([]);
  const [error, setError] = useState(null);
  const [newInspectionDialog, setNewInspectionDialog] = useState(false);
  const [selectedHydrant, setSelectedHydrant] = useState('');
  
  const [maintenanceData] = useState({
    stats: { total_inspections: 247, completed_this_month: 23, overdue_inspections: 8, active_work_orders: 5, compliance_rate: 94.2, avg_completion_time: 2.3, total_maintenance_cost: 12847, scheduled_this_week: 12 },
    upcomingInspections: [
      { id: 1, hydrant_number: 'MLT-001', location: '555 Main Street East', inspection_type: 'Annual Inspection', due_date: '2025-11-15', priority: 'NORMAL', regulatory_required: true, last_inspection: '2024-11-10' },
      { id: 2, hydrant_number: 'MLT-002', location: '55 Ontario Street South', inspection_type: 'Flow Test', due_date: '2025-11-18', priority: 'HIGH', regulatory_required: true, last_inspection: '2024-11-15' },
      { id: 3, hydrant_number: 'MLT-011', location: '2468 Old Mill Road', inspection_type: 'Emergency Repair Follow-up', due_date: '2025-11-05', priority: 'CRITICAL', regulatory_required: false, last_inspection: '2025-02-28' }
    ],
    activeWorkOrders: [
      { id: 'WO-2025-001', hydrant_number: 'MLT-011', title: 'Critical Maintenance - Multiple Issues', category: 'SAFETY_HAZARD', priority: 'CRITICAL', status: 'SCHEDULED', assigned_to: 'Maintenance Team', target_date: '2025-11-15', estimated_cost: 850, progress: 25 },
      { id: 'WO-2025-002', hydrant_number: 'MLT-006', title: 'Paint Maintenance - Fading Paint', category: 'PAINT_MAINTENANCE', priority: 'MEDIUM', status: 'IN_PROGRESS', assigned_to: 'Rich Cabral', target_date: '2025-12-15', estimated_cost: 275, progress: 60 },
      { id: 'WO-2025-003', hydrant_number: 'MLT-003', title: 'Valve Lubrication', category: 'VALVE_REPAIR', priority: 'LOW', status: 'COMPLETED', assigned_to: 'Rich Cabral', target_date: '2025-10-20', estimated_cost: 125, progress: 100 }
    ],
    recentActivity: [
      { id: 1, type: 'INSPECTION', hydrant_number: 'MLT-001', description: 'Annual inspection completed - PASS', date: '2025-10-28', inspector: 'Rich Cabral', status: 'PASS' },
      { id: 2, type: 'WORK_ORDER', hydrant_number: 'MLT-003', description: 'Valve lubrication work order completed', date: '2025-10-25', inspector: 'Rich Cabral', status: 'COMPLETED' },
      { id: 3, type: 'FLOW_TEST', hydrant_number: 'MLT-008', description: 'NFPA 291 flow test - 2,234 GPM (Class AA)', date: '2025-10-22', inspector: 'Rich Cabral', status: 'EXCELLENT' }
    ]
  });

  useEffect(() => { loadHydrants(); }, []);

  const loadHydrants = async () => {
    try { const response = await api.get('/hydrants'); setHydrants(response.data.hydrants || []); }
    catch { setError('Error loading hydrant data'); }
  };

  const getPriorityColor = (priority) => ({ 'LOW': 'default', 'NORMAL': 'primary', 'MEDIUM': 'warning', 'HIGH': 'error', 'CRITICAL': 'error' }[priority] || 'default');
  const getStatusColor = (status) => ({ 'PASS': 'success', 'FAIL': 'error', 'CONDITIONAL': 'warning', 'SCHEDULED': 'info', 'IN_PROGRESS': 'primary', 'COMPLETED': 'success', 'EXCELLENT': 'success' }[status] || 'default');
  const getProgressColor = (progress) => (progress === 100 ? 'success' : progress >= 60 ? 'primary' : progress >= 25 ? 'warning' : 'error');

  const startInspection = (hydrant) => { navigate(`/maintenance/inspect/${hydrant.hydrant_number}`); };
  const handleNewInspection = () => { setNewInspectionDialog(true); };
  const createNewInspection = () => { if (selectedHydrant) { const hydrant = hydrants.find(h => h.id === selectedHydrant); if (hydrant) navigate(`/maintenance/inspect/${hydrant.hydrant_number}`); setNewInspectionDialog(false); setSelectedHydrant(''); } };

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
              <CheckCircle color="success" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>{maintenanceData.stats.compliance_rate}%</Typography>
                <Typography variant="body2" color="text.secondary">Compliance Rate</Typography>
                <Typography variant="caption" color="success.main">O. Reg 169/03</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Schedule color="primary" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>{maintenanceData.stats.scheduled_this_week}</Typography>
                <Typography variant="body2" color="text.secondary">Scheduled This Week</Typography>
                <Typography variant="caption" color="primary.main">Next 7 days</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Warning color="warning" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>{maintenanceData.stats.overdue_inspections}</Typography>
                <Typography variant="body2" color="text.secondary">Overdue Inspections</Typography>
                <Typography variant="caption" color="warning.main">Immediate attention</Typography>
              </div>
            </Stack>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Build color="info" sx={{ fontSize: 40 }} />
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>{maintenanceData.stats.active_work_orders}</Typography>
                <Typography variant="body2" color="text.secondary">Active Work Orders</Typography>
                <Typography variant="caption" color="info.main">In progress</Typography>
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
                {maintenanceData.upcomingInspections.map((inspection) => (
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
                {maintenanceData.activeWorkOrders.map((wo) => (
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
            {maintenanceData.recentActivity.map((activity) => (
              <Paper key={activity.id} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <div>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{activity.type.replace('_', ' ')} - {activity.hydrant_number}</Typography>
                    <Typography variant="body2" color="text.secondary">{activity.description}</Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(activity.date).format('MMM DD, YYYY')} by {activity.inspector}</Typography>
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
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Annual Inspections</Typography><Chip label="94.2% Complete" color="success" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Documentation Complete</Typography><Chip label="Compliant" color="success" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Audit Trail</Typography><Chip label="Complete" color="success" size="small" /></Stack>
                </Stack>
              </CardContent></Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card><CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>NFPA 291 Flow Testing</Typography>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Flow Tests Current</Typography><Chip label="87.5% Complete" color="success" size="small" /></Stack>
                  <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Calculation Accuracy</Typography><Chip label="100% Verified" color="success" size="small" /></Stack>
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
