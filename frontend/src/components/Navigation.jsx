import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, useMediaQuery, Avatar, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { ExpandMore } from '@mui/icons-material';

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
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hydrantsMenuAnchor, setHydrantsMenuAnchor] = useState(null);

  // Determine user permissions
  const isAdmin = user?.role === 'admin' || user?.is_superadmin;
  const isSuperadmin = user?.is_superadmin;

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    const event = new CustomEvent('mobile-nav-toggle');
    document.dispatchEvent(event);
  };

  const handleHydrantsMenuOpen = (event) => {
    setHydrantsMenuAnchor(event.currentTarget);
  };

  const handleHydrantsMenuClose = () => {
    setHydrantsMenuAnchor(null);
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
            {/* Dashboard - Available to all users */}
            <NavButton to="/dashboard" label="Dashboard" active={path.startsWith('/dashboard')} />
            
            {/* Map - Available to all users */}
            <NavButton to="/map" label="Map" active={path.startsWith('/map')} />
            
            {/* Hydrants Menu with Dropdown for Admins */}
            {isAdmin ? (
              <>
                <Button
                  color={path.startsWith('/hydrants') ? 'secondary' : 'inherit'}
                  sx={{ mx: 0.5, fontWeight: path.startsWith('/hydrants') ? 700 : 500 }}
                  onClick={handleHydrantsMenuOpen}
                  endIcon={<ExpandMore />}
                >
                  Hydrants
                </Button>
                <Menu
                  anchorEl={hydrantsMenuAnchor}
                  open={Boolean(hydrantsMenuAnchor)}
                  onClose={handleHydrantsMenuClose}
                >
                  <MenuItem onClick={() => { navigate('/hydrants/new'); handleHydrantsMenuClose(); }}>
                    Add New Hydrant
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/hydrants/import'); handleHydrantsMenuClose(); }}>
                    Bulk Import
                  </MenuItem>
                </Menu>
              </>
            ) : null}
            
            {/* Inspections - Available to all users (operators and admins) */}
            <NavButton to="/inspections" label="Inspections" active={path.startsWith('/inspections')} />
            
            {/* Flow Tests - Available to all users (operators and admins) */}
            <NavButton to="/flow-test" label="Flow Test" active={path.startsWith('/flow-test')} />
            
            {/* Maintenance - Admin only */}
            {isAdmin && (
              <NavButton to="/maintenance" label="Maintenance" active={path.startsWith('/maintenance')} />
            )}
            
            {/* Reports - Admin only */}
            {isAdmin && (
              <NavButton to="/reports" label="Reports" active={path.startsWith('/reports')} />
            )}
            
            {/* Admin Panel - Superadmin only */}
            {isSuperadmin && (
              <NavButton to="/admin" label="Admin" active={path.startsWith('/admin')} />
            )}
            
            {/* External Link */}
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
