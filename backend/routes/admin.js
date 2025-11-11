const express = require('express');
const router = express.Router();
const path = require('path');
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Try to require checkSuperadmin with error handling
let checkSuperadmin;
try {
  checkSuperadmin = require(path.join(__dirname, '..', 'middleware', 'checkSuperadmin'));
} catch (error) {
  console.error('Failed to load checkSuperadmin middleware:', error.message);
  // Fallback middleware if file is missing
  checkSuperadmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    }
    next();
  };
}

// Protect all admin routes with both auth and superadmin check
router.use(authMiddleware);
router.use(checkSuperadmin);

// Admin: List all registered users and their organizations
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        o.name as organization_name,
        o.type as organization_type
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users: users.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: List all registered organizations
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await db.query(`
      SELECT 
        id,
        name,
        type,
        contact_email,
        created_at
      FROM organizations
      ORDER BY created_at DESC
    `);
    res.json({ success: true, organizations: orgs.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
