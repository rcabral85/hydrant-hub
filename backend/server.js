const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Test database connection first
const { db } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - use environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'http://localhost:3000',
      'http://localhost:5173',
    ];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');
const orgSignupRoutes = require('./routes/org-signup');
const bulkImportRoutes = require('./routes/bulkImport');
const dashboardRoutes = require('./routes/dashboard');
const maintenanceRoutes = require('./routes/maintenance');

// API Routes - Order matters! More specific routes first!

// Public routes (no auth)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-signup', orgSignupRoutes);

// Protected routes (auth required) - specific before general
app.use('/api/admin', adminRoutes);
app.use('/api/hydrants/import', bulkImportRoutes);
app.use('/api/hydrants', hydrantRoutes);
app.use('/api/flow-tests', flowTestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HydrantHub API Server',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      signup: '/api/org-signup',
      hydrants: '/api/hydrants',
      flow_tests: '/api/flow-tests',
      maintenance: '/api/maintenance',
      admin: '/api/admin',
    },
    documentation: 'https://github.com/rcabral85/hydrant-hub',
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'HydrantHub API',
    version: '1.0.0',
    description: 'Fire hydrant flow testing and management platform API',
    endpoints: {
      '/api/health': 'Health check and system status',
      '/api/auth': 'Authentication and user management',
      '/api/org-signup': 'Organization registration and account creation',
      '/api/hydrants': 'Hydrant inventory and management',
      '/api/flow-tests': 'Flow test data and NFPA 291 calculations',
      '/api/maintenance': 'Maintenance tracking and compliance',
      '/api/admin': 'Administrative functions',
    },
  });
});

// Database debug endpoint
app.get('/api/debug/schema', async (req, res) => {
  try {
    const flowTestCols = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'flow_tests' 
      ORDER BY ordinal_position
    `);

    const hydrantCols = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'hydrants' 
      ORDER BY ordinal_position
    `);

    res.json({
      success: true,
      tables: {
        flow_tests: flowTestCols.rows,
        hydrants: hydrantCols.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'GET /api/debug/schema',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/org-signup/signup',
      'GET /api/hydrants',
      'GET /api/flow-tests',
      'GET /api/maintenance',
    ],
  });
});

// Global error handler - Enhanced logging
app.use((error, req, res, next) => {
  // Always log errors server-side
  console.error('Unhandled error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing gracefully...');
  try { 
    await db.end(); 
    console.log('Database connections closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing gracefully...');
  try { 
    await db.end(); 
    console.log('Database connections closed');
  } catch (err) {
    console.error('Error closing database:', err);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 HydrantHub API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);

  try {
    const health = await db.healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Database connection healthy');
      try {
        const migration = require('./scripts/railway-migration');
        await migration();
        console.log('✅ Database migrations completed');
      } catch (migrationError) {
        console.warn('⚠️  Migration check failed:', migrationError.message);
      }
    } else {
      console.error('❌ Database connection unhealthy');
    }
  } catch (healthError) {
    console.error('❌ Database health check failed:', healthError.message);
  }
});

module.exports = app;
