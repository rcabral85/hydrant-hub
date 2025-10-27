const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');
const { authenticateToken, optionalAuth, rateLimit } = require('./middleware/auth');

// Route imports with absolute paths
const healthRoutes = require(path.join(__dirname, 'routes', 'health'));
const authRoutes = require(path.join(__dirname, 'routes', 'auth'));
const flowTestRoutes = require(path.join(__dirname, 'routes', 'flow-tests'));
const hydrantRoutes = require(path.join(__dirname, 'routes', 'hydrants'));

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for API routes
app.use('/api/', rateLimit(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check (no auth required)
app.use('/api/health', healthRoutes);
console.log('✅ Mounted /api/health');

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);
console.log('✅ Mounted /api/auth');

// Protected API routes (authentication required)
app.use('/api/flow-tests', authenticateToken, flowTestRoutes);
console.log('✅ Mounted /api/flow-tests (protected)');

app.use('/api/hydrants', authenticateToken, hydrantRoutes);
console.log('✅ Mounted /api/hydrants (protected)');

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'HydrantHub API',
    version: '1.0.0',
    description: 'Professional fire hydrant flow testing and management platform',
    author: 'Trident Systems',
    endpoints: {
      public: {
        health: 'GET /api/health',
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
          refresh: 'POST /api/auth/refresh'
        }
      },
      protected: {
        profile: 'GET /api/auth/me',
        hydrants: {
          list: 'GET /api/hydrants',
          create: 'POST /api/hydrants',
          get: 'GET /api/hydrants/:id',
          update: 'PUT /api/hydrants/:id',
          delete: 'DELETE /api/hydrants/:id',
          history: 'GET /api/hydrants/:id/history',
          geojson: 'GET /api/hydrants/map/geojson'
        },
        flowTests: {
          list: 'GET /api/flow-tests',
          create: 'POST /api/flow-tests',
          get: 'GET /api/flow-tests/:id',
          approve: 'POST /api/flow-tests/:id/approve',
          calculator: 'POST /api/flow-tests/calculator/test'
        }
      }
    },
    documentation: 'https://github.com/rcabral85/hydrant-management/blob/main/README.md',
    support: 'support@tridentsys.ca'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'HydrantHub API Server', 
    version: '1.0.0', 
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoints (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/routes', (req, res) => {
    res.json({ 
      mounted: ['/api/health', '/api/auth', '/api/flow-tests', '/api/hydrants'],
      timestamp: new Date().toISOString(),
      __dirname: __dirname,
      environment: process.env.NODE_ENV
    });
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'The requested resource does not exist.',
    path: req.path
  });
});

// Global error handler
app.use(errorHandler || ((err, req, res, next) => { 
  console.error('Unhandled error:', err);
  
  // Don't expose error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  }); 
}));

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔥 HydrantHub API server running on port ${PORT}`);
    console.log(`📚 API documentation: http://localhost:${PORT}/api`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;