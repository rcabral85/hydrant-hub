import React from 'react';
import { Box, Typography } from '@mui/material';

function NotFound() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 12 }}>
      <Typography variant="h3" color="primary">404</Typography>
      <Typography variant="h5" sx={{ mb: 2 }}>Page not found</Typography>
      <Typography variant="body2" color="text.secondary">Sorry, the page you are looking for does not exist.</Typography>
    </Box>
  );
}

export default NotFound;
