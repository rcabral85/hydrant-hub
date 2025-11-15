import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Box,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    // Clear all authentication tokens and data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('hydrantHub_token');
    localStorage.removeItem('hydrantHub_user');
    
    // Close mobile menu if open
    setMobileOpen(false);
    
    // Navigate to login page
    navigate('/login', { replace: true });
  };

  const handleNavigation = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Hydrant Map', path: '/map' },
    { label: 'Hydrants', path: '/hydrants' },
    { label: 'Fire Flow Tests', path: '/flow-test' },
    { label: 'Maintenance', path: '/maintenance' },
    { label: 'Reports', path: '/reports' },
    { label: 'Admin', path: '/admin' }
  ];

  const drawer = (
    <Box
      sx={{
        width: 280,
        height: '100%',
        bgcolor: '#1e3c72',
        color: 'white'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <img 
            src="/trident-logo.png" 
            alt="HydrantHub Logo" 
            style={{ height: '32px', width: '32px' }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
            HydrantHub
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <List sx={{ py: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                py: 2,
                px: 3,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.16)'
                  }
                }
              }}
            >
              <Typography
                sx={{
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  fontSize: '0.95rem'
                }}
              >
                {item.label}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
        
        <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
        
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              py: 2,
              px: 3,
              color: '#ff6b6b',
              '&:hover': {
                bgcolor: 'rgba(255, 107, 107, 0.1)'
              }
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              Logout
            </Typography>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          bgcolor: '#1e3c72',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', md: '64px' } }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <img 
              src="/trident-logo.png" 
              alt="HydrantHub Logo" 
              style={{ height: '32px', width: '32px' }}
            />
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.125rem', md: '1.25rem' },
                color: 'white',
                textDecoration: 'none',
                letterSpacing: '-0.025em'
              }}
            >
              HydrantHub
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                onClick={handleLogout}
                sx={{
                  color: '#ff6b6b',
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255, 107, 107, 0.1)'
                  }
                }}
              >
                Logout
              </Button>
            </Box>
          )}

          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ ml: 'auto' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 280
          }
        }}
      >
        {drawer}
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar sx={{ minHeight: { xs: '56px', md: '64px' } }} />
    </>
  );
};

export default Navigation;