import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { CloudUpload, CheckCircle, Warning } from '@mui/icons-material';
import Papa from 'papaparse';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const steps = ['Upload File', 'Preview & Validate', 'Import Complete'];

const BulkImport = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResults, setImportResults] = useState(null);

  // Handle file selection
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError('');

    // Parse CSV
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        setActiveStep(1);
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  // Validate data
  const handleValidate = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('hydrantHub_token');
      
      const response = await axios.post(
        `${API_URL}/hydrants/import/preview`,
        { data: csvData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setValidationResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed');
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Execute import
  const handleImport = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('hydrantHub_token');
      
      // Only import valid rows
      const validRows = validationResults.results
        .filter(r => r.valid)
        .map(r => r.data);

      const response = await axios.post(
        `${API_URL}/hydrants/import/execute`,
        { data: validRows },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setImportResults(response.data);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Download sample CSV
  const downloadSampleCSV = () => {
    const sample = `hydrant_number,address,lat,lon,manufacturer,model,year_installed,size_inches,outlet_count,nfpa_class,available_flow_gpm,status
H-001,123 Main Street,43.5182,-79.8774,Mueller,Super Centurion,2015,6,2,A,1500,active
H-002,456 Oak Avenue,43.5190,-79.8780,American,Super Flow,2018,6,3,B,900,active`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydrant_import_sample.csv';
    a.click();
  };

  // Reset form
  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setCsvData([]);
    setValidationResults(null);
    setImportResults(null);
    setError('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bulk Hydrant Import
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Step 1: Upload */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload Hydrant Data
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload a CSV or Excel file with hydrant information
          </Typography>

          <Button
            variant="outlined"
            onClick={downloadSampleCSV}
            sx={{ mb: 3 }}
          >
            Download Sample CSV
          </Button>

          <Box>
            <input
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
              >
                Choose File
              </Button>
            </label>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'left' }}>
            <Typography variant="subtitle2" gutterBottom>
              Required Columns:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • hydrant_number (required)
              <br />
              • address (required)
            </Typography>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Optional Columns:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • latitude, longitude, manufacturer, model, year_installed
              <br />
              • size_inches, outlet_count, nfpa_class, available_flow_gpm
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Step 2: Preview & Validate */}
      {activeStep === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Preview Data ({csvData.length} rows)
          </Typography>

          {!validationResults ? (
            <>
              <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {csvData[0] && Object.keys(csvData[0]).map((key) => (
                        <TableCell key={key}>{key}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, i) => (
                          <TableCell key={i}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={handleReset}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleValidate}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Validate Data'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Alert 
                severity={validationResults.invalidRows === 0 ? 'success' : 'warning'}
                sx={{ mb: 3 }}
              >
                {validationResults.validRows} valid rows, {validationResults.invalidRows} invalid rows
              </Alert>

              <TableContainer sx={{ maxHeight: 400, mb: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Hydrant Number</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Issues</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {validationResults.results.map((result) => (
                      <TableRow key={result.rowNumber}>
                        <TableCell>{result.rowNumber}</TableCell>
                        <TableCell>
                          {result.valid ? (
                            <Chip
                              icon={<CheckCircle />}
                              label="Valid"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<Warning />}
                              label="Invalid"
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>{result.data.hydrant_number}</TableCell>
                        <TableCell>{result.data.address}</TableCell>
                        <TableCell>
                          {result.errors.map((err, i) => (
                            <Typography key={i} variant="caption" color="error" display="block">
                              {err}
                            </Typography>
                          ))}
                          {result.warnings.map((warn, i) => (
                            <Typography key={i} variant="caption" color="warning.main" display="block">
                              {warn}
                            </Typography>
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button onClick={handleReset}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleImport}
                  disabled={loading || validationResults.validRows === 0}
                >
                  {loading ? <CircularProgress size={24} /> : `Import ${validationResults.validRows} Hydrants`}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Step 3: Complete */}
      {activeStep === 2 && importResults && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Import Complete!
          </Typography>
          <Typography variant="body1" paragraph>
            {importResults.message}
          </Typography>

          {importResults.errors && importResults.errors.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2, textAlign: 'left' }}>
              <Typography variant="subtitle2">Errors:</Typography>
              {importResults.errors.map((err, i) => (
                <Typography key={i} variant="caption" display="block">
                  {err.hydrant_number}: {err.error}
                </Typography>
              ))}
            </Alert>
          )}

          <Button variant="contained" onClick={handleReset}>
            Import More Hydrants
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default BulkImport;
