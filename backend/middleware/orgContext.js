const { db } = require('../config/database');

/**
 * Middleware to attach organization context to request
 * Eliminates repetitive database queries across routes
 * 
 * Usage: app.use('/api/protected-route', authenticateToken, attachOrgContext, routeHandler);
 */
async function attachOrgContext(req, res, next) {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await db.query(
      'SELECT organization_id, role FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Attach organization context to request object
    req.organizationId = result.rows[0].organization_id;
    req.userRole = result.rows[0].role;
    
    next();
  } catch (error) {
    console.error('Organization context error:', error);
    res.status(500).json({ error: 'Failed to retrieve organization context' });
  }
}

module.exports = { attachOrgContext };
