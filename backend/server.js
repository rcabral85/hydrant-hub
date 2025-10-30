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

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://hydranthub.tridentsys.ca', 'http://localhost:5173', 'https://stunning-cascaron-f49a60.netlify.app', 'https://app.tridentsys.ca'],
  credentials: true,
  optionsSuccessStatus: 200
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

// Static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/flow-tests', flowTestRoutes);
app.use('/api/hydrants', hydrantRoutes);

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
      hydrants: '/api/hydrants',
      flow_tests: '/api/flow-tests',
      admin: '/api/admin'
    },
    documentation: 'https://github.com/rcabral85/hydrant-management'
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
      '/api/hydrants': 'Hydrant inventory and management',
      '/api/flow-tests': 'Flow test data and NFPA 291 calculations',
      '/api/admin': 'Administrative functions'
    }
  });
});

// Database debug endpoint
app.get('/api/debug/schema', async (req, res) => {
  try {
    // Check table structure
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
        hydrants: hydrantCols.rows
      }
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
      'GET /api/hydrants',
      'GET /api/flow-tests'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  try { await db.end(); } catch {}
  process.exit(0);
});
process.on('SIGINT', async () => {
  try { await db.end(); } catch {}
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 HydrantHub API Server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for: ${corsOptions.origin}`);

  try {
    const health = await db.healthCheck();
    if (health.status === 'healthy') {
      try {
        const migration = require('./scripts/railway-migration');
        await migration();
      } catch {}
    }
  } catch {}
});

module.exports = app;
