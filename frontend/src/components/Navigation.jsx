import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

function NavButton({ to, label, active }) {
  return (
    <Button
      component={RouterLink}
      to={to}
      color={active ? 'secondary' : 'inherit'}
      sx={{ mx: 0.5, fontWeight: active ? 700 : 500 }}
    >
      {label}
    </Button>
  );
}

export default function Navigation() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { logout } = useAuth();

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const path = location.pathname;

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        {isMobile && (
          <IconButton edge="start" color="inherit" sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/dashboard"
          sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 700 }}
        >
          HydrantHub
        </Typography>

        {!isMobile && (
          <Box>
            <NavButton to="/dashboard" label="Dashboard" active={path.startsWith('/dashboard')} />
            <NavButton to="/map" label="Map" active={path.startsWith('/map')} />
            <NavButton to="/flow-test" label="Flow Test" active={path.startsWith('/flow-test')} />
          </Box>
        )}

        <Button color="inherit" onClick={onLogout} sx={{ ml: 1 }}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
