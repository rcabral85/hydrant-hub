const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Test database connection first
const { db } = require('./config/database');
const { authenticateToken } = require('./middleware/auth'); // ADD THIS

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());


// CORS configuration - explicit whitelist for new backend
const corsOptions = {
  origin: [
    'https://hydranthub.tridentsys.ca',
    'https://app.tridentsys.ca',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://stunning-cascaron-f49a60.netlify.app',
    'https://hydrant-hub-production.up.railway.app', // NEW: allow backend domain
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

// Static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');
const orgSignupRoutes = require('./routes/org-signup');

/// API Routes - Order matters! More specific routes first!

// Public routes (no auth)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/org-signup', orgSignupRoutes);
// ==================== Maintenance Routes ====================

app.get('/api/maintenance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    const organizationId = user.rows[0].organization_id;

    const result = await db.query(`
      SELECT m.*, h.hydrant_id, h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1
      ORDER BY m.scheduled_date DESC
    `, [organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/maintenance/inspections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    const organizationId = user.rows[0].organization_id;

    const result = await db.query(`
      SELECT m.*, h.hydrant_id, h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1 
      AND m.maintenance_type = 'inspection'
      ORDER BY m.scheduled_date DESC
    `, [organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/maintenance/work-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    const organizationId = user.rows[0].organization_id;

    const result = await db.query(`
      SELECT m.*, h.hydrant_id, h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1 
      AND m.maintenance_type IN ('repair', 'painting', 'lubrication', 'winterization', 'other')
      ORDER BY m.scheduled_date DESC
    `, [organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/maintenance/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    const organizationId = user.rows[0].organization_id;

    const stats = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1
    `, [organizationId]);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/maintenance/compliance/schedule', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await db.query('SELECT organization_id FROM users WHERE id = $1', [userId]);
    const organizationId = user.rows[0].organization_id;

    const schedule = await db.query(`
      SELECT 
        h.hydrant_id,
        h.location,
        h.last_inspection_date,
        CASE 
          WHEN h.last_inspection_date IS NULL THEN 'overdue'
          WHEN h.last_inspection_date < NOW() - INTERVAL '1 year' THEN 'overdue'
          WHEN h.last_inspection_date < NOW() - INTERVAL '9 months' THEN 'due_soon'
          ELSE 'compliant'
        END as compliance_status
      FROM hydrants h
      WHERE h.organization_id = $1
      ORDER BY h.last_inspection_date ASC NULLS FIRST
    `, [organizationId]);

    res.json(schedule.rows);
  } catch (error) {
    console.error('Error fetching compliance schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/maintenance', authenticateToken, async (req, res) => {
  try {
    const {
      hydrant_id,
      maintenance_type,
      description,
      status,
      scheduled_date,
      completed_date,
      technician,
      notes
    } = req.body;

    const result = await db.query(`
      INSERT INTO maintenance (
        hydrant_id, maintenance_type, description, status,
        scheduled_date, completed_date, technician, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [hydrant_id, maintenance_type, description, status, scheduled_date, completed_date, technician, notes]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
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
      tests: '/api/tests',
      flow_tests: '/api/flow-tests',
      admin: '/api/admin',
    },
    documentation: 'https://github.com/rcabral85/hydrant-management',
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
      '/api/tests': 'Flow test data and NFPA 291 calculations (alias)',
      '/api/flow-tests': 'Flow test data and NFPA 291 calculations',
      '/api/admin': 'Administrative functions',
    },
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
      'GET /api/tests',
      'GET /api/flow-tests',
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
