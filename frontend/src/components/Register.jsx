import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalFireDepartment,
  Business,
  Person,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Register() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Organization Info
    organizationName: '',
    organizationType: 'municipality',
    organizationAddress: '',
    organizationPhone: '',
    organizationEmail: '',
    
    // User Info
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'operator'
  });
  
  const [formErrors, setFormErrors] = useState({});

  const steps = ['Organization', 'User Account'];

  const organizationTypes = [
    { value: 'municipality', label: 'Municipality' },
    { value: 'fire_department', label: 'Fire Department' },
    { value: 'water_utility', label: 'Water Utility' },
    { value: 'contractor', label: 'Contractor' },
    { value: 'property_management', label: 'Property Management' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      // Organization validation
      if (!formData.organizationName.trim()) {
        errors.organizationName = 'Organization name is required';
      }
      if (!formData.organizationType) {
        errors.organizationType = 'Organization type is required';
      }
      if (formData.organizationEmail && !/\S+@\S+\.\S+/.test(formData.organizationEmail)) {
        errors.organizationEmail = 'Invalid email format';
      }
    } else if (step === 1) {
      // User validation
      if (!formData.username.trim()) {
        errors.username = 'Username is required';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        errors.username = 'Username can only contain letters, numbers, and underscores';
      } else if (formData.username.length < 3) {
        errors.username = 'Username must be at least 3 characters';
      }
      
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format';
      }
      
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.firstName.trim()) {
        errors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last name is required';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Create organization
      const orgResponse = await axios.post(`${API_URL}/api/admin/organizations`, {
        name: formData.organizationName,
        type: formData.organizationType,
        address: formData.organizationAddress || null,
        contact_phone: formData.organizationPhone || null,
        contact_email: formData.organizationEmail || null
      });

      const organizationId = orgResponse.data.organization.id;

      // Step 2: Register user with organization_id
      const userResponse = await axios.post(`${API_URL}/api/auth/register`, {
        organization_id: organizationId,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        role: formData.role
      });

      if (userResponse.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created successfully! Please sign in.' 
            } 
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (success) {
    return (
      <Container 
        component="main" 
        maxWidth={false}
        sx={{
          minHeight: '100vh',
          display: 'flex',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 6,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            maxWidth: 500
          }}
        >
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="600">
            Account Created Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting you to the login page...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container 
      component="main" 
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        padding: 2
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2
        }}
      >
        {!isMobile && (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              textAlign: 'center',
              maxWidth: 500,
              mr: 4
            }}
          >
            <LocalFireDepartment sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Join HydrantHub
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Start managing your fire hydrants professionally with our FREE trial
            </Typography>
            
            <Box sx={{ textAlign: 'left', width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                What's Included:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography>✓ NFPA 291 Compliant Testing</Typography>
                <Typography>✓ Interactive Hydrant Mapping</Typography>
                <Typography>✓ Maintenance Tracking</Typography>
                <Typography>✓ Professional Reports</Typography>
                <Typography>✓ Mobile Inspection Tools</Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Box
          sx={{
            flex: isMobile ? 1 : 0.8,
            maxWidth: 600,
            width: '100%'
          }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isMobile && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <LocalFireDepartment sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                  HydrantHub
                </Typography>
              </Box>
            )}

            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              fontWeight="600"
              sx={{ mb: 1 }}
            >
              Create Your Account
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Get started with your FREE trial today
            </Typography>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Business /> Organization Information
                  </Typography>
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="organizationName"
                    label="Organization Name"
                    name="organizationName"
                    autoFocus
                    value={formData.organizationName}
                    onChange={handleChange}
                    error={!!formErrors.organizationName}
                    helperText={formErrors.organizationName}
                  />

                  <FormControl 
                    fullWidth 
                    margin="normal" 
                    required
                    error={!!formErrors.organizationType}
                  >
                    <InputLabel>Organization Type</InputLabel>
                    <Select
                      name="organizationType"
                      value={formData.organizationType}
                      onChange={handleChange}
                      label="Organization Type"
                    >
                      {organizationTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.organizationType && (
                      <FormHelperText>{formErrors.organizationType}</FormHelperText>
                    )}
                  </FormControl>

                  <TextField
                    margin="normal"
                    fullWidth
                    id="organizationAddress"
                    label="Address (Optional)"
                    name="organizationAddress"
                    multiline
                    rows={2}
                    value={formData.organizationAddress}
                    onChange={handleChange}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        fullWidth
                        id="organizationPhone"
                        label="Phone (Optional)"
                        name="organizationPhone"
                        value={formData.organizationPhone}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        fullWidth
                        id="organizationEmail"
                        label="Email (Optional)"
                        name="organizationEmail"
                        type="email"
                        value={formData.organizationEmail}
                        onChange={handleChange}
                        error={!!formErrors.organizationEmail}
                        helperText={formErrors.organizationEmail}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      size="large"
                    >
                      Next
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Your Account Details
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        autoFocus
                        value={formData.firstName}
                        onChange={handleChange}
                        error={!!formErrors.firstName}
                        helperText={formErrors.firstName}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        error={!!formErrors.lastName}
                        helperText={formErrors.lastName}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    error={!!formErrors.username}
                    helperText={formErrors.username || 'Letters, numbers, and underscores only'}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                  />

                  <TextField
                    margin="normal"
                    fullWidth
                    id="phone"
                    label="Phone Number (Optional)"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password || 'At least 6 characters'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      onClick={handleBack}
                      size="large"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                sx={{ 
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Sign In
              </Link>
            </Box>
          </Paper>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              © 2025 Trident Systems. Built for water operators by water operators.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default Register;