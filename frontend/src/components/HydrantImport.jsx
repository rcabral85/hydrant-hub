import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Stepper, Step, StepLabel,
  CircularProgress, Chip, Stack, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Warning, Visibility, History } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_URL
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('hydrantHub_token') ||
    localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove or comment this to avoid leaking token presence in prod logs
  // console.log('Bulk import request with token:', token ? 'YES' : 'NO');
  return config;
});

export default function HydrantImport() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const steps = ['Upload File', 'Preview & Validate', 'Import Complete'];

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        setParsedData(jsonData);
        setActiveStep(1);
      } catch (err) {
        setError('Failed to parse file. Please ensure it is a valid CSV or Excel file.');
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const handleValidate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/hydrants/import/preview', {
        data: parsedData,
        filename: file.name
      });
      
      setValidationResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/hydrants/import/commit', {
        data: parsedData,
        filename: file.name
      });
      
      setImportResults(response.data);
      setActiveStep(2);
      await loadImportHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const loadImportHistory = async () => {
    try {
      const response = await api.get('/hydrants/import/history');
      setImportHistory(response.data.imports || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setImportResults(null);
    setError(null);
  };

  // ... rest of the original component code ...

  // (omitted below for brevity - use *all* the original render step and return code as before)

  const renderUploadStep = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      {/* ... unchanged ... */}
      <CloudUpload sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>Upload Hydrant Data</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV or Excel file with hydrant information
      </Typography>
      <Button variant="contained" component="label" size="large" startIcon={<CloudUpload />}>
        Select File
        <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
      </Button>
      <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2, textAlign: 'left' }}>
        {/* ... unchanged ... */}
        <Typography variant="subtitle2" gutterBottom>Required Columns:</Typography>
        <Typography variant="body2">• hydrant_number (required)</Typography>
        <Typography variant="body2">• address (required)</Typography>
        <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>Optional Columns:</Typography>
        <Typography variant="body2">• latitude, longitude, manufacturer, model, year_installed</Typography>
        <Typography variant="body2">• size_inches, outlet_count, nfpa_class, available_flow_gpm</Typography>
      </Box>
      <Button variant="text" startIcon={<History />} onClick={() => { loadImportHistory(); setShowHistory(true); }} sx={{ mt: 2 }}>
        View Import History
      </Button>
    </Box>
  );

  const renderValidationStep = () => (
    <Box sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">Preview & Validation</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleReset}>Cancel</Button>
          <Button variant="contained" onClick={validationResults ? handleCommit : handleValidate} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : validationResults ? 'Commit Import' : 'Validate Data'}
          </Button>
        </Stack>
      </Stack>
      {parsedData.length > 0 && (<Alert severity="info" sx={{ mb: 2 }}>Found {parsedData.length} rows in file: {file?.name}</Alert>)}
      {validationResults && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Alert severity={validationResults.valid_count > 0 ? 'success' : 'error'}>
            <strong>{validationResults.valid_count}</strong> valid rows, 
            <strong> {validationResults.error_count}</strong> errors
          </Alert>
          {validationResults.errors && validationResults.errors.length > 0 && (
            <Paper sx={{ p: 2, bgcolor: 'error.lighter' }}>
              <Typography variant="subtitle2" gutterBottom>Validation Errors:</Typography>
              {validationResults.errors.slice(0, 10).map((err, idx) => (
                <Typography key={idx} variant="body2" color="error">• Row {err.row}: {err.message}</Typography>
              ))}
            </Paper>
          )}
        </Stack>
      )}
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {Object.keys(parsedData[0] || {}).map((key) => (
                <TableCell key={key}><strong>{key}</strong></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {parsedData.slice(0, 50).map((row, idx) => (
              <TableRow key={idx}>
                {Object.values(row).map((val, i) => (
                  <TableCell key={i}>{String(val)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {parsedData.length > 50 && (<Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Showing first 50 rows</Typography>)}
    </Box>
  );

  const renderCompleteStep = () => (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>Import Complete!</Typography>
      {importResults && (<Stack spacing={2} sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h4" color="success.main">{importResults.successful_rows}</Typography>
          <Typography variant="body2">Hydrants imported successfully</Typography>
        </Paper>
        {importResults.failed_rows > 0 && (<Paper sx={{ p: 2, bgcolor: 'error.lighter' }}>
          <Typography variant="h4" color="error">{importResults.failed_rows}</Typography>
          <Typography variant="body2">Failed imports</Typography>
        </Paper>)}
      </Stack>)}
      <Button variant="contained" onClick={handleReset} sx={{ mt: 4 }}>
        Import Another File
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Bulk Hydrant Import</Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
        </Stepper>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {activeStep === 0 && renderUploadStep()}
        {activeStep === 1 && renderValidationStep()}
        {activeStep === 2 && renderCompleteStep()}
      </Paper>
      {/* Import History Dialog */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import History</DialogTitle>
        <DialogContent>{importHistory.length === 0 ? (<Typography color="text.secondary">No import history available</Typography>) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Filename</TableCell>
                  <TableCell>Success</TableCell>
                  <TableCell>Failed</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{importHistory.map((imp) => (
                <TableRow key={imp.id}>
                  <TableCell>{new Date(imp.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{imp.filename}</TableCell>
                  <TableCell>{imp.successful_rows}</TableCell>
                  <TableCell>{imp.failed_rows}</TableCell>
                  <TableCell>{imp.total_rows}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        )}</DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}