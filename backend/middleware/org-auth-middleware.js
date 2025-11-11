// Organization-Aware JWT Auth Middleware for HydrantHub
// Ensures req.user is set with organization_id on every authenticated request
// Usage: app.use(orgAuthMiddleware) BEFORE all secured routes

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

module.exports = async function orgAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');

    // Fetch user with org metadata (org_id, role, is_active)
    const result = await db.query(
      `SELECT id, username, organization_id, role, is_active FROM users WHERE id = $1 AND is_active = true`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
