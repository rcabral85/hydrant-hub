// HydrantHub Reports & Analytics Page
// Comprehensive reporting for municipal compliance and audit requirements
// Advanced analytics and PDF generation

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Button, Paper,
  FormControl, InputLabel, Select, MenuItem, TextField, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import {
  PictureAsPdf, TrendingUp, Assessment, DateRange, FilterList,
  Description, BarChart, InsertChart, Download, Email, Print,
  CheckCircle, Warning, Info, Build
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(3, 'months'),
    end: dayjs()
  });
  const [reportType, setReportType] = useState('compliance');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Sample report data - in production this would come from your API
  const [sampleReports] = useState({
    compliance: {
      title: 'Municipal Compliance Report',
      description: 'Complete O. Reg 169/03 and NFPA 291 compliance status',
      stats: {
        total_hydrants: 247,
        inspections_completed: 233,
        compliance_rate: 94.3,
        overdue_count: 8,
        work_orders_completed: 156,
        total_maintenance_cost: 23847
      },
      breakdown: [
        { category: 'Annual Inspections', completed: 233, required: 247, percentage: 94.3 },
        { category: 'Flow Tests (NFPA 291)', completed: 216, required: 247, percentage: 87.4 },
        { category: 'Valve Maintenance', completed: 241, required: 247, percentage: 97.6 },
        { category: 'Emergency Repairs', completed: 12, required: 15, percentage: 80.0 }
      ]
    },
    maintenance: {
      title: 'Maintenance Summary Report',
      description: 'Preventive maintenance activities and cost analysis',
      stats: {
        inspections_ytd: 233,
        work_orders_created: 187,
        work_orders_completed: 156,
        avg_completion_time: 2.3,
        total_labor_hours: 486.5,
        total_cost: 23847
      },
      categories: [
        { name: 'Valve Repair', count: 45, cost: 8950, percentage: 37.5 },
        { name: 'Paint Maintenance', count: 38, cost: 6840, percentage: 28.7 },
        { name: 'Cap Replacement', count: 23, cost: 2990, percentage: 12.5 },
        { name: 'Safety Hazards', count: 18, cost: 3200, percentage: 13.4 },
        { name: 'Other', count: 32, cost: 1867, percentage: 7.8 }
      ]
    },
    performance: {
      title: 'System Performance Analysis',
      description: 'Hydrant performance metrics and flow test analysis',
      stats: {
        avg_static_pressure: 72.3,
        avg_flow_rate: 1647,
        class_aa_percentage: 72.9,
        class_a_percentage: 18.6,
        class_b_percentage: 6.5,
        class_c_percentage: 2.0
      },
      trends: [
        { month: 'Aug 2025', avg_flow: 1634, avg_pressure: 71.8 },
        { month: 'Sep 2025', avg_flow: 1652, avg_pressure: 72.1 },
        { month: 'Oct 2025', avg_flow: 1647, avg_pressure: 72.3 }
      ]
    }
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      setReportData(sampleReports[reportType]);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    // In production, this would call your PDF generation API
    console.log('Downloading PDF report...');
    alert('PDF report downloaded! (Demo mode)');
  };

  const emailReport = () => {
    console.log('Emailing report...');
    alert('Report emailed to specified recipients! (Demo mode)');
  };

  const getComplianceColor = (percentage) => {
    if (percentage >= 95) return 'success';
    if (percentage >= 85) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Municipal compliance reports, performance analytics, and audit documentation
          </Typography>
        </div>
      </Stack>

      {/* Report Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Generate Report
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="compliance">Municipal Compliance</MenuItem>
                  <MenuItem value="maintenance">Maintenance Summary</MenuItem>
                  <MenuItem value="performance">Performance Analysis</MenuItem>
                  <MenuItem value="audit">Audit Report</MenuItem>
                  <MenuItem value="cost">Cost Analysis</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange({...dateRange, start: newValue})}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange({...dateRange, end: newValue})}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<Assessment />}
                onClick={generateReport}
                disabled={loading}
                sx={{ height: 56 }}
              >
                Generate Report
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Description color="primary" sx={{ fontSize: 40 }} />
                <div>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    15
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Report Types Available
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <div>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    94.3%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Compliance
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <BarChart color="info" sx={{ fontSize: 40 }} />
                <div>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                    233
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Inspections This Year
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Build color="warning" sx={{ fontSize: 40 }} />
                <div>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    156
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Work Orders Completed
                  </Typography>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Available Reports */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Available Reports
              </Typography>
              <Grid container spacing={2}>
                {[
                  {
                    title: 'Municipal Compliance Report',
                    description: 'O. Reg 169/03 compliance status with audit trail',
                    icon: <CheckCircle color="success" />,
                    type: 'compliance'
                  },
                  {
                    title: 'NFPA 291 Flow Test Summary',
                    description: 'Fire flow testing results and classifications',
                    icon: <Assessment color="primary" />,
                    type: 'flow_tests'
                  },
                  {
                    title: 'Maintenance Cost Analysis',
                    description: 'Preventive vs reactive maintenance costs',
                    icon: <TrendingUp color="info" />,
                    type: 'costs'
                  },
                  {
                    title: 'Work Order Summary',
                    description: 'Active and completed work order analysis',
                    icon: <Build color="warning" />,
                    type: 'work_orders'
                  },
                  {
                    title: 'Inspector Performance',
                    description: 'Inspection efficiency and quality metrics',
                    icon: <Description color="secondary" />,
                    type: 'inspector'
                  },
                  {
                    title: 'System Performance Trends',
                    description: 'Pressure and flow rate analysis over time',
                    icon: <BarChart color="primary" />,
                    type: 'performance'
                  }
                ].map((report, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        border: reportType === report.type ? 2 : 0,
                        borderColor: 'primary.main'
                      }}
                      onClick={() => setReportType(report.type)}
                    >
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {report.icon}
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {report.title}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Reports
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <PictureAsPdf color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Q4 2025 Compliance Report"
                    secondary="Generated Oct 28, 2025"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BarChart color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Flow Test Analysis - Oct 2025"
                    secondary="Generated Oct 25, 2025"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Assessment color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Maintenance Cost Report"
                    secondary="Generated Oct 20, 2025"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Export Options
              </Typography>
              <Stack spacing={1}>
                <Button 
                  variant="outlined" 
                  startIcon={<PictureAsPdf />} 
                  fullWidth
                  onClick={downloadPDF}
                >
                  Download PDF
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Email />} 
                  fullWidth
                  onClick={emailReport}
                >
                  Email Report
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Download />} 
                  fullWidth
                >
                  Export to Excel
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Print />} 
                  fullWidth
                >
                  Print Report
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Preview Modal */}
      <Dialog open={showPreview} onHide={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {reportData?.title}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<PictureAsPdf />} onClick={downloadPDF}>
                Download PDF
              </Button>
              <Button startIcon={<Email />} onClick={emailReport}>
                Email
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {reportData && (
            <Box>
              {/* Report Header */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {reportData.title}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {reportData.description}
                </Typography>
                <Typography variant="body2">
                  Report Period: {dateRange.start.format('MMM DD, YYYY')} - {dateRange.end.format('MMM DD, YYYY')}
                </Typography>
                <Typography variant="body2">
                  Generated: {dayjs().format('MMM DD, YYYY HH:mm')} | Generated by: Rich Cabral (Water Distribution Operator)
                </Typography>
              </Paper>

              {/* Compliance Report Content */}
              {reportType === 'compliance' && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Executive Summary
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {reportData.stats.total_hydrants}
                          </Typography>
                          <Typography variant="body2">Total Hydrants</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {reportData.stats.compliance_rate}%
                          </Typography>
                          <Typography variant="body2">Compliance Rate</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {reportData.stats.overdue_count}
                          </Typography>
                          <Typography variant="body2">Overdue Items</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            ${reportData.stats.total_maintenance_cost.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">Maintenance Costs</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Regulatory Compliance Breakdown
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Requirement Category</TableCell>
                          <TableCell align="center">Completed</TableCell>
                          <TableCell align="center">Required</TableCell>
                          <TableCell align="center">Compliance %</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.breakdown.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell align="center">{item.completed}</TableCell>
                            <TableCell align="center">{item.required}</TableCell>
                            <TableCell align="center">
                              <Typography sx={{ fontWeight: 600 }}>
                                {item.percentage}%
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.percentage >= 95 ? 'COMPLIANT' : item.percentage >= 85 ? 'ATTENTION' : 'NON-COMPLIANT'}
                                color={getComplianceColor(item.percentage)}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Maintenance Report Content */}
              {reportType === 'maintenance' && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Maintenance Activity Summary
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {reportData.stats.inspections_ytd}
                          </Typography>
                          <Typography variant="body2">Inspections YTD</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {reportData.stats.work_orders_completed}
                          </Typography>
                          <Typography variant="body2">Work Orders Done</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {reportData.stats.avg_completion_time}
                          </Typography>
                          <Typography variant="body2">Avg Days</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {reportData.stats.total_labor_hours}
                          </Typography>
                          <Typography variant="body2">Labor Hours</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary.main">
                            ${reportData.stats.total_cost.toLocaleString()}
                          </Typography>
                          <Typography variant="body2">Total Cost</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Maintenance Categories
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="center">Count</TableCell>
                          <TableCell align="center">Total Cost</TableCell>
                          <TableCell align="center">% of Total</TableCell>
                          <TableCell align="center">Avg Cost</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.categories.map((category, index) => (
                          <TableRow key={index}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell align="center">{category.count}</TableCell>
                            <TableCell align="center">${category.cost.toLocaleString()}</TableCell>
                            <TableCell align="center">{category.percentage}%</TableCell>
                            <TableCell align="center">${Math.round(category.cost / category.count)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Performance Report Content */}
              {reportType === 'performance' && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    System Performance Metrics
                  </Typography>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {reportData.stats.avg_static_pressure}
                          </Typography>
                          <Typography variant="body2">Avg Static PSI</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {reportData.stats.avg_flow_rate}
                          </Typography>
                          <Typography variant="body2">Avg Flow GPM</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {reportData.stats.class_aa_percentage}%
                          </Typography>
                          <Typography variant="body2">Class AA</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {reportData.stats.class_a_percentage}%
                          </Typography>
                          <Typography variant="body2">Class A</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Performance Trends (Last 3 Months)
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align="center">Avg Flow (GPM)</TableCell>
                          <TableCell align="center">Avg Pressure (PSI)</TableCell>
                          <TableCell align="center">Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.trends.map((trend, index) => (
                          <TableRow key={index}>
                            <TableCell>{trend.month}</TableCell>
                            <TableCell align="center">{trend.avg_flow.toLocaleString()}</TableCell>
                            <TableCell align="center">{trend.avg_pressure}</TableCell>
                            <TableCell align="center">
                              <TrendingUp color="success" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper functions for report generation
const downloadPDF = () => {
  console.log('Downloading PDF report...');
  alert('PDF report downloaded! Check your downloads folder.');
};

const emailReport = () => {
  console.log('Emailing report...');
  alert('Report emailed to rcabral85@gmail.com and municipal recipients!');
};