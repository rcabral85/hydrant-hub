import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Divider
} from '@mui/material';
import { CheckCircle, Error, API, LocationOn } from '@mui/icons-material';
import api from '../services/api';

function TestPage() {
  const [testResults, setTestResults] = useState({
    health: null,
    hydrants: null,
    flowTests: null,
    sampleTest: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    const results = {};

    try {
      // Test 1: Health Check
      console.log('Testing health endpoint...');
      const healthResponse = await api.get('/health');
      results.health = healthResponse.data;

      // Test 2: List Hydrants
      console.log('Testing hydrants endpoint...');
      const hydrantsResponse = await api.get('/hydrants');
      results.hydrants = hydrantsResponse.data;

      // Test 3: List Flow Tests
      console.log('Testing flow tests endpoint...');
      const flowTestsResponse = await api.get('/flow-tests');
      results.flowTests = flowTestsResponse.data;

      // Test 4: Create Sample Flow Test (if hydrants exist)
      if (results.hydrants?.hydrants?.length > 0) {
        console.log('Creating sample flow test...');
        const testHydrant = results.hydrants.hydrants[0];
        
        const sampleTestData = {
          hydrant_id: testHydrant.id,
          test_date: new Date().toISOString().split('T')[0],
          static_pressure_psi: 65,
          residual_pressure_psi: 45,
          outlets: [
            { size: 2.5, pitotPressure: 42, coefficient: 0.9 },
            { size: 2.5, pitotPressure: 38, coefficient: 0.9 }
          ],
          weather_conditions: 'Clear',
          temperature_f: 68,
          notes: 'Frontend test - API connection verification'
        };

        try {
          const sampleTestResponse = await api.post('/flow-tests', sampleTestData);
          results.sampleTest = sampleTestResponse.data;
        } catch (testError) {
          results.sampleTest = { error: testError.response?.data || testError.message };
        }
      }

      setTestResults(results);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const TestResultCard = ({ title, result, icon }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
          {result && (
            <Chip
              icon={result.error ? <Error /> : <CheckCircle />}
              label={result.error ? 'Failed' : 'Success'}
              color={result.error ? 'error' : 'success'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          )}
        </Box>
        
        {result && (
          <Box>
            {result.error ? (
              <Alert severity="error">
                {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
              </Alert>
            ) : (
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                {JSON.stringify(result, null, 2)}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          🧪 HydrantHub API Connection Test
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          This page tests the connection between the React frontend and the Railway API backend.
        </Typography>

        <Box mb={3}>
          <Button 
            variant="contained" 
            onClick={runTests} 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <API />}
          >
            {loading ? 'Running Tests...' : 'Run API Tests'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">Connection Error</Typography>
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <TestResultCard 
          title="Health Check" 
          result={testResults.health}
          icon={<CheckCircle color="primary" />}
        />

        <TestResultCard 
          title="Hydrants List" 
          result={testResults.hydrants}
          icon={<LocationOn color="primary" />}
        />

        <TestResultCard 
          title="Flow Tests List" 
          result={testResults.flowTests}
          icon={<API color="primary" />}
        />

        {testResults.sampleTest && (
          <TestResultCard 
            title="Sample Flow Test Creation" 
            result={testResults.sampleTest}
            icon={<API color="primary" />}
          />
        )}

        {testResults.hydrants?.hydrants && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📍 Available Hydrants
              </Typography>
              {testResults.hydrants.hydrants.map(hydrant => (
                <Box key={hydrant.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {hydrant.hydrant_number} - Class {hydrant.nfpa_class}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    📍 {hydrant.address}
                  </Typography>
                  <Typography variant="body2">
                    💧 {hydrant.available_flow_gpm} GPM | 🏢 {hydrant.organization_name}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Paper>
    </Container>
  );
}

export default TestPage;