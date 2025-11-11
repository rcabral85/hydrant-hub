const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

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
