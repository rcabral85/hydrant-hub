const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Database connection
const { db } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Security middleware
app.use(helmet());

// CORS configuration
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

// ============================================
// ROUTES
// ============================================

// Import route modules
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');
const orgSignupRoutes = require('./routes/org-signup');
const bulkImportRoutes = require('./routes/bulkImport');
const dashboardRoutes = require('./routes/dashboard');
const maintenanceRoutes = require('./routes/maintenance');
const userRoutes = require('./routes/users'); // From PR #31
const reportsRoutes = require('./routes/reports');

// Public routes (no authentication required)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-signup', orgSignupRoutes);

// Protected routes (authentication required)
// Order matters - more specific routes first!
app.use('/api/admin', adminRoutes);
app.use('/api/hydrants/import', bulkImportRoutes);
app.use('/api/hydrants', hydrantRoutes);
app.use('/api/flow-tests', flowTestRoutes);
app.use('/api/tests', flowTestRoutes); // Alias for flow-tests
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/users', userRoutes); // From PR #31
app.use('/api/reports', reportsRoutes);

// ============================================
// API DOCUMENTATION ENDPOINTS
// ============================================

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
      users: '/api/users',
      reports: '/api/reports',
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
      '/api/hydrants/import': 'Bulk import hydrants from CSV',
      '/api/tests': 'Flow test data and NFPA 291 calculations (alias)',
      '/api/flow-tests': 'Flow test data and NFPA 291 calculations',
      '/api/maintenance': 'Maintenance tracking, inspections, and work orders',
      '/api/dashboard': 'Dashboard statistics and recent activity',
      '/api/admin': 'Administrative functions and user management',
      '/api/users': 'User management and team members',
      '/api/reports': 'Report generation and analytics',
    },
  });
});

// Database debug endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/schema', async (req, res) => {
    try {
      const tables = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      const tableDetails = {};
      for (const table of tables.rows) {
        const columns = await db.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table.table_name]);
        tableDetails[table.table_name] = columns.rows;
      }

      res.json({
        success: true,
        tables: tableDetails,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    hint: 'See available endpoints at GET /api',
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

// ============================================
// SERVER STARTUP & SHUTDOWN
// ============================================

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  try {
    await db.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  try {
    await db.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log('🚀 HydrantHub API Server');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${corsOptions.origin.length} origins`);

  // Check database connection
  try {
    const health = await db.healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Database connected');

      // Run migrations if available
      try {
        const migration = require('./scripts/railway-migration');
        await migration();
        console.log('✅ Database migrations applied');
      } catch (migrationError) {
        console.log('ℹ️  No migrations to apply');
      }
    } else {
      console.error('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }

  console.log('\n📚 API Documentation: http://localhost:' + PORT + '/api');
});

module.exports = app;