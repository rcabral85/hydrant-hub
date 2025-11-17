const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Test database connection first
const { db } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration - explicit whitelist
const corsOptions = {
  origin: [
    'https://hydranthub.tridentsys.ca',
    'https://app.tridentsys.ca',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://stunning-cascaron-f49a60.netlify.app',
    'https://hydrant-hub-production.up.railway.app',
  ],
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

// =============================================
// API ROUTES
// =============================================
// Order matters! More specific routes first!

// Public routes (no auth)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-signup', orgSignupRoutes);

// Protected routes (auth required)
app.use('/api/admin', adminRoutes);
app.use('/api/hydrants/import', bulkImportRoutes);
app.use('/api/hydrants', hydrantRoutes);
app.use('/api/flow-tests', flowTestRoutes);
app.use('/api/tests', flowTestRoutes); // Alias for flow-tests
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// =============================================
// ROOT & DOCUMENTATION ENDPOINTS
// =============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HydrantHub API Server',
    version: '2.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      signup: '/api/org-signup',
      hydrants: '/api/hydrants',
      tests: '/api/tests',
      flow_tests: '/api/flow-tests',
      maintenance: '/api/maintenance',
      dashboard: '/api/dashboard',
      admin: '/api/admin',
    },
    documentation: 'https://github.com/rcabral85/hydrant-hub',
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'HydrantHub API',
    version: '2.0.0',
    description: 'Fire hydrant flow testing and management platform API',
    endpoints: {
      '/api/health': 'Health check and system status',
      '/api/auth': 'Authentication and user management',
      '/api/org-signup': 'Organization registration and account creation',
      '/api/hydrants': 'Hydrant inventory and management',
      '/api/tests': 'Flow test data and NFPA 291 calculations (alias)',
      '/api/flow-tests': 'Flow test data and NFPA 291 calculations',
      '/api/maintenance': 'Maintenance tracking and compliance',
      '/api/dashboard': 'Dashboard statistics and recent activity',
      '/api/admin': 'Administrative functions',
    },
  });
});

// Database debug endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/schema', async (req, res) => {
    try {
      const tables = ['users', 'organizations', 'hydrants', 'flow_tests', 'maintenance_inspections', 'work_orders'];
      const tableInfo = {};

      for (const table of tables) {
        const cols = await db.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        tableInfo[table] = cols.rows;
      }

      res.json({
        success: true,
        tables: tableInfo,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// =============================================
// ERROR HANDLERS
// =============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/org-signup/signup',
      'GET /api/hydrants',
      'GET /api/flow-tests',
      'GET /api/maintenance',
      'GET /api/dashboard',
    ],
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// =============================================
// SERVER STARTUP & SHUTDOWN
// =============================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server gracefully...');
  try { await db.end(); } catch {}
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server gracefully...');
  try { await db.end(); } catch {}
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 HydrantHub API Server v2.0 running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${corsOptions.origin.join(', ')}`);

  try {
    const health = await db.healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Database connection healthy');
      
      // Run migrations if needed
      try {
        const migration = require('./scripts/railway-migration');
        await migration();
        console.log('✅ Database migrations complete');
      } catch (migrationError) {
        console.log('ℹ️  No migrations needed or migration script not found');
      }
    } else {
      console.error('❌ Database connection unhealthy:', health);
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
});

module.exports = app;