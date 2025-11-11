// Full Organization-Aware Middleware Enforcement Example
// Add this pattern to backend/server.js after initializing your Express app instance

const orgAuthMiddleware = require('./middleware/org-auth-middleware');

// Insert BEFORE all secured API routes:
app.use('/api', orgAuthMiddleware); // Ensures org context on every request

// Example: Expose a public health check that does NOT require org/user
app.use('/api/health', require('./routes/health'));

// All further APIs (hydrants, flow-tests, etc) will now securely require login+org
app.use('/api/hydrants', require('./routes/hydrants'));
app.use('/api/flow-tests', require('./routes/flow-tests'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/admin', require('./routes/admin'));

// The main benefit: this blocks unauthorized requests and ensures req.user is always available
// Adjust route registration order as needed for public endpoints.

module.exports = app;