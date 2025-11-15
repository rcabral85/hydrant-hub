const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const checkSuperadmin = require('../middleware/checkSuperadmin');
const pool = require('../config/database');

// Apply authentication to all admin routes
router.use(authenticateToken);

/**
 * GET /api/admin/users
 * Get all users (superadmin only)
 */
router.get('/users', checkSuperadmin, async (req, res) => {
  console.log('=== ADMIN /users ROUTE ===');
  console.log('Full req.user:', JSON.stringify(req.user, null, 2));
  console.log('is_superadmin value:', req.user?.is_superadmin);
  console.log('is_superadmin type:', typeof req.user?.is_superadmin);

  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_superadmin,
        u.is_active,
        u.created_at,
        u.organization_id,
        o.name as organization_name,
        o.type as organization_type
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

/**
 * GET /api/admin/organizations
 * Get all organizations (superadmin only)
 */
router.get('/organizations', checkSuperadmin, async (req, res) => {
  console.log('=== ADMIN /organizations ROUTE ===');
  console.log('Full req.user:', JSON.stringify(req.user, null, 2));

  try {
    const result = await pool.query(`
      SELECT 
        o.id,
        o.name,
        o.type,
        o.contact_email,
        o.contact_phone,
        o.address,
        o.city,
        o.province,
        o.postal_code,
        o.created_at,
        o.updated_at,
        COUNT(u.id) as user_count,
        COUNT(h.id) as hydrant_count
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN hydrants h ON o.id = h.organization_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      organizations: result.rows
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      error: 'Failed to fetch organizations',
      details: error.message
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (superadmin only)
 */
router.post('/users', checkSuperadmin, async (req, res) => {
  const { username, email, password, first_name, last_name, role, organization_id, is_superadmin } = req.body;

  try {
    const bcrypt = require('bcrypt');
    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role, organization_id, is_superadmin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [username, email, password_hash, first_name, last_name, role, organization_id, is_superadmin || false]);

    res.status(201).json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message
    });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user (superadmin only)
 */
router.put('/users/:id', checkSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, first_name, last_name, role, organization_id, is_superadmin, is_active } = req.body;

  try {
    const result = await pool.query(`
      UPDATE users
      SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        first_name = COALESCE($3, first_name),
        last_name = COALESCE($4, last_name),
        role = COALESCE($5, role),
        organization_id = COALESCE($6, organization_id),
        is_superadmin = COALESCE($7, is_superadmin),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [username, email, first_name, last_name, role, organization_id, is_superadmin, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      details: error.message
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (superadmin only)
 */
router.delete('/users/:id', checkSuperadmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      details: error.message
    });
  }
});

module.exports = router;
