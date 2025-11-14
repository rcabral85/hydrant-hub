import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography, Avatar, Box, IconButton, Menu, MenuItem, Drawer, List, ListItem, ListItemText, Divider, Collapse } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import { useAuth } from '../contexts/AuthContext';
const logoUrl = '/trident-icon.png';

// Reusable nav button component for consistency
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

export default function Navigation({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();
  
  const [hydrantsMenuAnchor, setHydrantsMenuAnchor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileHydrantsOpen, setMobileHydrantsOpen] = useState(false);
  
  const isMobile = window.innerWidth < 960;
  const isAdmin = user?.role === 'admin';
  const isSuperadmin = user?.is_superadmin === true;

  const handleHydrantsMenuOpen = (event) => {
    setHydrantsMenuAnchor(event.currentTarget);
  };

  const handleHydrantsMenuClose = () => {
    setHydrantsMenuAnchor(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
    setMobileHydrantsOpen(false);
  };

  const handleMobileNavigation = (path) => {
    navigate(path);
    handleMobileMenuClose();
  };

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
            
            <NavButton to="/inspections" label="Inspections" active={path.startsWith('/inspections')} />
            <NavButton to="/flow-test" label="Flow Test" active={path.startsWith('/flow-test')} />
            
            {isAdmin && (
              <NavButton to="/maintenance" label="Maintenance" active={path.startsWith('/maintenance')} />
            )}
            
            {isAdmin && (
              <NavButton to="/reports" label="Reports" active={path.startsWith('/reports')} />
            )}
            
            {isSuperadmin && (
              <NavButton to="/admin" label="Admin" active={path.startsWith('/admin')} />
            )}
            
            <Button component="a" href="https://tridentsys.ca" target="_blank" rel="noopener" color="inherit" sx={{ mx: 0.5 }}>
              Trident Site
            </Button>
          </Box>
        )}

        <Button color="inherit" onClick={onLogout} sx={{ ml: 1 }}>
          Logout
        </Button>
      </Toolbar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {/* Dashboard */}
            <ListItem button onClick={() => handleMobileNavigation('/dashboard')}>
              <ListItemText primary="Dashboard" />
            </ListItem>

            {/* Map */}
            <ListItem button onClick={() => handleMobileNavigation('/map')}>
              <ListItemText primary="Map" />
            </ListItem>

            {/* Hydrants - Admin only with submenu */}
            {isAdmin && (
              <>
                <ListItem button onClick={() => setMobileHydrantsOpen(!mobileHydrantsOpen)}>
                  <ListItemText primary="Hydrants" />
                  {mobileHydrantsOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={mobileHydrantsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigation('/hydrants/new')}>
                      <ListItemText primary="Add New Hydrant" />
                    </ListItem>
                    <ListItem button sx={{ pl: 4 }} onClick={() => handleMobileNavigation('/hydrants/import')}>
                      <ListItemText primary="Bulk Import" />
                    </ListItem>
                  </List>
                </Collapse>
              </>
            )}

            {/* Inspections */}
            <ListItem button onClick={() => handleMobileNavigation('/inspections')}>
              <ListItemText primary="Inspections" />
            </ListItem>

            {/* Flow Test */}
            <ListItem button onClick={() => handleMobileNavigation('/flow-test')}>
              <ListItemText primary="Flow Test" />
            </ListItem>

            {/* Maintenance - Admin only */}
            {isAdmin && (
              <ListItem button onClick={() => handleMobileNavigation('/maintenance')}>
                <ListItemText primary="Maintenance" />
              </ListItem>
            )}

            {/* Reports - Admin only */}
            {isAdmin && (
              <ListItem button onClick={() => handleMobileNavigation('/reports')}>
                <ListItemText primary="Reports" />
              </ListItem>
            )}

            {/* Admin - Superadmin only */}
            {isSuperadmin && (
              <ListItem button onClick={() => handleMobileNavigation('/admin')}>
                <ListItemText primary="Admin" />
              </ListItem>
            )}

            <Divider />

            {/* External Link */}
            <ListItem button component="a" href="https://tridentsys.ca" target="_blank" rel="noopener">
              <ListItemText primary="Trident Site" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
