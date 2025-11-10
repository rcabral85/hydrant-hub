import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, useMediaQuery, Avatar } from '@mui/material';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Trigger the mobile navigation JavaScript
    const event = new CustomEvent('mobile-nav-toggle');
    document.dispatchEvent(event);
  };

  const path = location.pathname;

  const logoUrl = 'https://tridentsys.ca/trident-logo.png';

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        {isMobile && (
          <IconButton 
            edge="start" 
            color="inherit" 
            sx={{ mr: 1 }}
            onClick={handleMobileMenuToggle}
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box component={RouterLink} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none', flexGrow: 1 }}>
          <Avatar src={logoUrl} alt="Trident Systems" sx={{ width: 32, height: 32, mr: 1, bgcolor: 'transparent' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>HydrantHub</Typography>
        </Box>

        {!isMobile && (
          <Box>
            <NavButton to="/dashboard" label="Dashboard" active={path.startsWith('/dashboard')} />
            <NavButton to="/map" label="Map" active={path.startsWith('/map')} />
            <NavButton to="/maintenance" label="Maintenance" active={path.startsWith('/maintenance')} />
            <NavButton to="/flow-test" label="Flow Test" active={path.startsWith('/flow-test')} />
            <NavButton to="/reports" label="Reports" active={path.startsWith('/reports')} />
            <NavButton to="/inspections" label="Inspections" active={path.startsWith('/inspections')} />
            <Button component="a" href="https://tridentsys.ca" target="_blank" rel="noopener" color="inherit" sx={{ mx: 0.5 }}>
              Trident Site
            </Button>
          </Box>
        )}

        <Button color="inherit" onClick={onLogout} sx={{ ml: 1 }}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
