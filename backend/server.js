const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const flowTestRoutes = require('./routes/flow-tests');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/flow-tests', flowTestRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'HydrantHub API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      flowTests: '/api/flow-tests',
      documentation: '/api/docs'
    },
    build: {
      service: 'hydrant-management-backend',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/flow-tests',
      'GET /api/flow-tests'
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔥 HydrantHub API server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📄 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`🚫 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  });
}

module.exports = app;
