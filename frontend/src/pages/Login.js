import React from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';

function Login() {
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, bgcolor: '#fff', borderRadius: 3, boxShadow: 1 }}>
      <Typography variant="h5" color="primary" gutterBottom>Sign In to HydrantHub</Typography>
      <form>
        <TextField label="Email" variant="outlined" fullWidth sx={{ mb: 2 }} />
        <TextField label="Password" variant="outlined" fullWidth type="password" sx={{ mb: 3 }} />
        <Button variant="contained" color="primary" fullWidth>Login</Button>
      </form>
    </Box>
  );
}

export default Login;
