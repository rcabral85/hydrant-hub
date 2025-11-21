import React, { useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Button, Paper,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, List, ListItem, ListItemText, ListItemIcon, Alert
} from '@mui/material';
import {
  PictureAsPdf, TrendingUp, Assessment,
  Description, BarChart, Download, Email, Print,
  CheckCircle, Build
} from '@mui/icons-material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(3, 'months'),
    end: dayjs()
  });
  const [reportType, setReportType] = useState('compliance');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reports/generate', {
        params: {
          type: reportType,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        }
      });
      setReportData(response.data);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report. Please try again.');
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(25, 118, 210); // Primary blue
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(reportData.title, 14, 25);

    doc.setFontSize(10);
    doc.text(`Generated: ${dayjs().format('MMM DD, YYYY HH:mm')}`, 14, 35);

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(reportData.description, 14, 50);
    doc.text(`Period: ${dayjs(dateRange.start).format('MMM DD, YYYY')} - ${dayjs(dateRange.end).format('MMM DD, YYYY')}`, 14, 58);

    let yPos = 70;

    // Stats Section
    if (reportData.stats) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Key Statistics', 14, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const stats = Object.entries(reportData.stats);
      stats.forEach(([key, value], index) => {
        const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        doc.text(`${label}: ${value}`, 14 + (index % 2) * 90, yPos + Math.floor(index / 2) * 8);
      });
      yPos += Math.ceil(stats.length / 2) * 8 + 15;
    }

    // Tables
    if (reportData.breakdown) {
      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Completed', 'Required', 'Compliance %']],
        body: reportData.breakdown.map(item => [
          item.category,
          item.completed,
          item.required,
          `${item.percentage}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] }
      });
    } else if (reportData.categories) {
      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Count', 'Cost', '% Total']],
        body: reportData.categories.map(item => [
          item.name,
          item.count,
          `$${item.cost}`,
          `${item.percentage}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [25, 118, 210] }
      });
    }

    doc.save(`${reportType}_report_${dayjs().format('YYYY-MM-DD')}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Create Summary Sheet
    const summaryData = [
      ['Report Title', reportData.title],
      ['Description', reportData.description],
      ['Generated Date', dayjs().format('YYYY-MM-DD HH:mm')],
      ['Start Date', dayjs(dateRange.start).format('YYYY-MM-DD')],
      ['End Date', dayjs(dateRange.end).format('YYYY-MM-DD')],
      [],
      ['Key Statistics'],
      ...Object.entries(reportData.stats || {}).map(([k, v]) => [k, v])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Create Data Sheet
    let dataRows = [];
    if (reportData.breakdown) dataRows = reportData.breakdown;
    else if (reportData.categories) dataRows = reportData.categories;
    else if (reportData.trends) dataRows = reportData.trends;

    if (dataRows.length > 0) {
      const wsData = XLSX.utils.json_to_sheet(dataRows);
      XLSX.utils.book_append_sheet(wb, wsData, "Data Details");
    }

    XLSX.writeFile(wb, `${reportType}_report_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    toast.success('Excel file exported successfully');
  };

  const emailReport = () => {
    // Placeholder for email integration
    toast.info('Email functionality coming soon (requires backend integration)');
  };

  const getComplianceColor = (percentage) => {
    const val = parseFloat(percentage);
    if (val >= 95) return 'success';
    if (val >= 85) return 'warning';
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

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

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
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.start}
                  onChange={(newValue) => setDateRange({ ...dateRange, start: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="End Date"
                  value={dateRange.end}
                  onChange={(newValue) => setDateRange({ ...dateRange, end: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
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
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Available Reports Cards */}
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
                    title: 'Maintenance Cost Analysis',
                    description: 'Preventive vs reactive maintenance costs',
                    icon: <TrendingUp color="info" />,
                    type: 'maintenance'
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
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Report Preview Modal */}
      <Dialog open={showPreview} onClose={() => setShowPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              {reportData?.title}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<PictureAsPdf />} onClick={downloadPDF} variant="outlined" size="small">
                PDF
              </Button>
              <Button startIcon={<Download />} onClick={exportToExcel} variant="outlined" size="small">
                Excel
              </Button>
              <Button startIcon={<Email />} onClick={emailReport} variant="outlined" size="small">
                Email
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
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
                  Report Period: {dayjs(dateRange.start).format('MMM DD, YYYY')} - {dayjs(dateRange.end).format('MMM DD, YYYY')}
                </Typography>
              </Paper>

              {/* Stats Grid */}
              {reportData.stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  {Object.entries(reportData.stats).map(([key, value]) => (
                    <Grid item xs={6} md={3} key={key}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {typeof value === 'number' && key.includes('cost') ? `$${value.toLocaleString()}` : value}
                          </Typography>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              {/* Compliance Table */}
              {reportType === 'compliance' && reportData.breakdown && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
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
                          <TableCell align="center">{item.percentage}%</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={parseFloat(item.percentage) >= 95 ? 'COMPLIANT' : 'ATTENTION'}
                              color={getComplianceColor(item.percentage)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Maintenance Table */}
              {reportType === 'maintenance' && reportData.categories && (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="center">Count</TableCell>
                        <TableCell align="center">Cost</TableCell>
                        <TableCell align="center">% of Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.categories.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="center">{item.count}</TableCell>
                          <TableCell align="center">${item.cost}</TableCell>
                          <TableCell align="center">{item.percentage}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}