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
  Divider,
  Collapse,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrantsDropdownAnchor, setHydrantsDropdownAnchor] = useState(null);
  const [mobileHydrantsOpen, setMobileHydrantsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('hydrantHub_token');
    localStorage.removeItem('hydrantHub_user');
    setMobileOpen(false);
    navigate('/login', { replace: true });
  };

  // Hydrant Dropdown (desktop)
  const handleHydrantsMenuOpen = (event) => { setHydrantsDropdownAnchor(event.currentTarget); };
  const handleHydrantsMenuClose = () => { setHydrantsDropdownAnchor(null); };
  const goToHydrants = (path) => {
    handleHydrantsMenuClose();
    navigate(path);
  };

  // Mobile hydrants submenu
  const handleMobileHydrantsToggle = () => { setMobileHydrantsOpen((open) => !open); };
  const handleMobileNavigation = (path) => {
    setMobileOpen(false);
    setMobileHydrantsOpen(false);
    navigate(path);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Hydrant Map', path: '/map' },
    { label: 'Fire Flow Tests', path: '/flow-test' },
    { label: 'Maintenance', path: '/maintenance' },
    { label: 'Reports', path: '/reports' },
    { label: 'Admin', path: '/admin' }
  ];

  const hydrantDropdownItems = [
    { label: 'Bulk Import/Manage', path: '/hydrants' },
    { label: 'Add New Hydrant', path: '/hydrants/new' }
  ];

  const drawer = (
    <Box sx={{width: 280, height: '100%', bgcolor: '#1e3c72', color: 'white'}}>
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
          <img src="/trident-logo.png" alt="HydrantHub Logo" style={{height: '32px', width: '32px'}} />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem' }}>HydrantHub</Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </Box>
      <List sx={{ py: 0 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleMobileHydrantsToggle} selected={location.pathname.startsWith('/hydrants')} sx={{py:2, px:3, borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
            <Typography sx={{ fontWeight: location.pathname.startsWith('/hydrants') ? 600 : 500, fontSize: '0.95rem' }}>Hydrants</Typography>
            {mobileHydrantsOpen ? <ExpandLess sx={{ml:1}} /> : <ExpandMore sx={{ml:1}} />}
          </ListItemButton>
        </ListItem>
        <Collapse in={mobileHydrantsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 5 }} onClick={() => handleMobileNavigation('/hydrants')} selected={location.pathname === '/hydrants'}>
              <Typography variant="body2">Bulk Import/Manage</Typography>
            </ListItemButton>
            <ListItemButton sx={{ pl: 5 }} onClick={() => handleMobileNavigation('/hydrants/new')} selected={location.pathname === '/hydrants/new'}>
              <Typography variant="body2">Add New Hydrant</Typography>
            </ListItemButton>
          </List>
        </Collapse>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => handleMobileNavigation(item.path)} selected={location.pathname === item.path} sx={{py:2, px:3, borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <Typography sx={{ fontWeight: location.pathname === item.path ? 600 : 500, fontSize: '0.95rem' }}>{item.label}</Typography>
            </ListItemButton>
          </ListItem>
        ))}
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }}/>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{py:2, px:3, color:'#ff6b6b', '&:hover':{bgcolor:'rgba(255,107,107,0.1)'}}}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Logout</Typography>
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ bgcolor: '#1e3c72', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
        <Toolbar sx={{ minHeight: { xs: '56px', md: '64px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <img src="/trident-logo.png" alt="HydrantHub Logo" style={{ height: '32px', width: '32px' }} />
            <Typography variant="h6" component={Link} to="/dashboard" sx={{ fontWeight: 700, fontSize: { xs: '1.125rem', md: '1.25rem' }, color: 'white', textDecoration: 'none', letterSpacing: '-0.025em' }}>
              HydrantHub
            </Typography>
          </Box>
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Hydrants dropdown */}
              <Button
                color="inherit"
                sx={{ textTransform: 'none', fontWeight: location.pathname.startsWith('/hydrants') ? 700 : 500, bgcolor: location.pathname.startsWith('/hydrants') ? 'rgba(255,255,255,0.12)' : 'transparent' }}
                onClick={handleHydrantsMenuOpen}
                endIcon={hydrantsDropdownAnchor ? <ExpandLess /> : <ExpandMore />}
              >
                Hydrants
              </Button>
              <Menu
                anchorEl={hydrantsDropdownAnchor}
                open={Boolean(hydrantsDropdownAnchor)}
                onClose={handleHydrantsMenuClose}
              >
                {hydrantDropdownItems.map((item) => (
                  <MenuItem key={item.path} onClick={() => goToHydrants(item.path)} selected={location.pathname === item.path}>{item.label}</MenuItem>
                ))}
              </Menu>
              {/* Other nav items */}
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{ color: 'white', textTransform: 'none', fontSize: '0.875rem', fontWeight: 500, px: 2, py: 1, borderRadius: 1, bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.12)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
                >
                  {item.label}
                </Button>
              ))}
              <Button
                onClick={handleLogout}
                sx={{ color: '#ff6b6b', textTransform: 'none', fontSize: '0.875rem', fontWeight: 600, px: 2, py: 1, borderRadius: 1, '&:hover': {bgcolor: 'rgba(255, 107, 107, 0.1)'}}}
              >
                Logout
              </Button>
            </Box>
          )}
          {isMobile && (
            <IconButton color="inherit" aria-label="open menu" edge="end" onClick={handleDrawerToggle} sx={{ ml: 'auto' }}>
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
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 280 } }}
      >
        {drawer}
      </Drawer>
      {/* Toolbar spacer */}
      <Toolbar sx={{ minHeight: { xs: '56px', md: '64px' } }} />
    </>
  );
};

export default Navigation;
