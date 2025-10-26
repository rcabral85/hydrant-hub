import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <Box sx={{ p: 4, width: '100%', maxWidth: 900, margin: '0 auto', bgcolor: '#fff', borderRadius: 4, mt: 4, boxShadow: 2 }}>
      <Typography variant="h4" color="primary" gutterBottom>
        HydrantHub Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Welcome to HydrantHub! Manage hydrants, conduct flow tests, review compliance, and generate PDF reports for municipalities, fire departments, and contractors.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button component={Link} to="/hydrants" variant="contained" color="primary">
          Hydrant Inventory
        </Button>
        <Button component={Link} to="/flow-tests" variant="contained" color="secondary">
          Flow Testing
        </Button>
      </Box>
      <Box>
        <Typography variant="subtitle1" color="text.secondary">
          Trident Systems &mdash; Ontario Water Operations
        </Typography>
      </Box>
    </Box>
  );
}

export default Dashboard;
