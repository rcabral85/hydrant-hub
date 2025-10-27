const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express(); // Must come first

// Import routes (only once)
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');

// Mount routes
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/flow-tests', flowTestRoutes);
app.use('/api/hydrants', hydrantRoutes);

// ...other middleware and server start code...
