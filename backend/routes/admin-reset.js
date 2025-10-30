const express = require('express');
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const router = express.Router();

// TEMPORARY: One-time admin password reset endpoint
// Remove after use for security
router.get('/reset-password', async (req, res, next) => {
  try {
    const { email, password, token } = req.query;

    // Simple guard token to prevent accidental access
    const EXPECTED = process.env.ADMIN_RESET_TOKEN || 'TRIDENT-RESET-ONLY-ONCE';
    if (!token || token !== EXPECTED) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, username, role',
      [hash, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Admin reset error:', error);
    next(error);
  }
});

module.exports = router;
