const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports with absolute paths
const healthRoutes = require(path.join(__dirname, 'routes', 'health'));
const flowTestRoutes = require(path.join(__dirname, 'routes', 'flow-tests'));
const hydrantRoutes = require(path.join(__dirname, 'routes', 'hydrants'));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (tiny)
app.use((req, res, next) => {
  console.log('REQ', req.method, req.path);
  next();
});

// Mount API routes with logging
app.use('/api/health', healthRoutes);
console.log('✅ Mounted /api/health');

app.use('/api/flow-tests', flowTestRoutes);
console.log('✅ Mounted /api/flow-tests');

app.use('/api/hydrants', hydrantRoutes);
console.log('✅ Mounted /api/hydrants');

// Debug endpoint
app.get('/api/debug/routes', (req, res) => {
  res.json({ 
    mounted: ['/api/health', '/api/flow-tests', '/api/hydrants'],
    timestamp: new Date().toISOString(),
    __dirname: __dirname
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'HydrantHub API Server', version: '1.0.0', status: 'running' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler || ((err, req, res, next) => { 
  console.error(err); 
  res.status(500).json({ error: 'Internal server error' }); 
}));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔥 HydrantHub API server running on port ${PORT}`);
  });
}

module.exports = app;
