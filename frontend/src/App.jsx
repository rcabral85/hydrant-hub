import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import EnhancedDashboard from './components/EnhancedDashboard';
import HydrantMapEnhanced from './components/HydrantMapEnhanced';
import FlowTestForm from './components/FlowTestForm';
import MaintenancePage from './components/MaintenancePage';
import ReportsPage from './components/ReportsPage';
import HydrantAdd from './components/HydrantAdd';
import MobileInspectionMUI from './components/MobileInspectionMUI';
import HydrantHubPage from './pages/HydrantHubPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import ServicesPage from './pages/ServicesPage';
import FireFlowTestingPage from './pages/FireFlowTestingPage';
import ContactPage from './pages/ContactPage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: { main: '#1e3c72', light: '#4a6bb5', dark: '#0a1929' },
    secondary: { main: '#ff6b35', light: '#ff9b6b', dark: '#c53a00' },
    background: { default: '#f5f7fa', paper: '#ffffff' },
    text: { primary: '#2c3e50', secondary: '#5a6c7d' },
  },
  typography: { 
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif', 
    h1: { fontWeight: 700 }, 
    h2: { fontWeight: 600 }, 
    h3: { fontWeight: 600 }, 
    h4: { fontWeight: 600 }, 
    h5: { fontWeight: 600 }, 
    h6: { fontWeight: 600 } 
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { styleOverrides: { root: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } } } },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiFab: { styleOverrides: { root: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' } } }
  }
});

function TitleUpdater() {
  const location = useLocation();
  React.useEffect(() => {
    const routeTitles = {
      '/login': 'Login',
      '/dashboard': 'Dashboard',
      '/map': 'Interactive Hydrant Map',
      '/maintenance': 'Maintenance Management',
      '/flow-test': 'Flow Test Form',
      '/reports': 'Reports & Analytics',
      '/hydrants/new': 'Add New Hydrant',
      '/hydranthub': 'HydrantHub',
      '/features': 'Features',
      '/pricing': 'Pricing',
      '/services': 'Services',
      '/services/fire-flow-testing': 'Fire Flow Testing',
      '/contact': 'Contact'
    };
    const hit = Object.keys(routeTitles).find(route => location.pathname.startsWith(route));
    const currentTitle = hit ? routeTitles[hit] : 'HydrantHub';
    document.title = `${currentTitle} - HydrantHub | Trident Systems`;
  }, [location.pathname]);
  return null;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (<Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress size={60} /></Box>);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (<Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress size={60} /></Box>);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing routes */}
      <Route path="/hydranthub" element={<HydrantHubPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/fire-flow-testing" element={<FireFlowTestingPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Public auth route */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* App routes (protected) */}
      <Route path="/dashboard" element={<ProtectedRoute><EnhancedDashboard /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><HydrantMapEnhanced /></ProtectedRoute>} />
      <Route path="/flow-test" element={<ProtectedRoute><FlowTestForm /></ProtectedRoute>} />
      <Route path="/flow-test/:hydrantId" element={<ProtectedRoute><FlowTestForm /></ProtectedRoute>} />
      <Route path="/hydrants/new" element={<ProtectedRoute><HydrantAdd /></ProtectedRoute>} />
      <Route path="/hydrants/:hydrantId/edit" element={<ProtectedRoute><HydrantAdd /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
      <Route path="/maintenance/inspect/:hydrantId" element={<ProtectedRoute><MobileInspectionMUI /></ProtectedRoute>} />
      <Route path="/maintenance/mobile/:hydrantId" element={<ProtectedRoute><MobileInspectionMUI /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

      {/* Default routes */}
      <Route path="/" element={<Navigate to="/hydranthub" replace />} />
      <Route path="*" element={<Navigate to="/hydranthub" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <TitleUpdater />
            <Header />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <AppRoutes />
            </Box>
            <Footer />
            <ToastContainer position="top-right" autoClose={5000} theme="light" />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
