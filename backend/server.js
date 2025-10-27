const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Must create the app first
const app = express();

// Now import routes
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const flowTestRoutes = require('./routes/flow-tests');
const hydrantRoutes = require('./routes/hydrants');

// Now you can mount admin route and others
app.use('/api/admin', adminRoutes);
// ...app.use calls for other routes, etc.

// (rest of your setup)
// ...top of file
const adminRoutes = require('./routes/admin');

// ...existing route setups
app.use('/api/admin', adminRoutes);
