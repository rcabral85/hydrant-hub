#!/usr/bin/env node
/**
 * One-time admin password reset script
 * Usage: node backend/scripts/reset-admin-password.js
 * Requires: DATABASE_URL env var (Railway sets this), NODE_ENV=production (for SSL)
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const email = process.env.ADMIN_EMAIL || 'admin@tridentsys.ca';
    const password = process.env.ADMIN_NEW_PASSWORD || 'TridentAdmin2025!';

    const hash = await bcrypt.hash(password, 12);

    const res = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id, email, username, role',
      [hash, email]
    );

    if (res.rowCount === 0) {
      console.log('No user found with that email. You may need to create the admin user first.');
      process.exit(1);
    }

    console.log('Admin password reset:', res.rows[0]);
    console.log('Use this password to login:', password);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
})();
