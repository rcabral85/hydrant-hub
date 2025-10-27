const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const router = express.Router();

// Set your secret as an env variable (ADMIN_SCHEMA_SECRET)
const ADMIN_SCHEMA_SECRET = process.env.ADMIN_SCHEMA_SECRET || 'change-this-secret';

// One-time: /api/admin/run-schema?secret=YOUR_SECRET
router.get('/run-schema', async (req, res) => {
  try {
    if (req.query.secret !== ADMIN_SCHEMA_SECRET) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Dynamically find schema.sql
    const tryPaths = [
      path.join(process.cwd(), 'sql', 'schema.sql'),
      path.join(process.cwd(), 'backend', 'sql', 'schema.sql'),
      path.join(process.cwd(), 'backend/sql/schema.sql'),
      path.join(__dirname, '../sql/schema.sql'),
      path.join(__dirname, '../../sql/schema.sql')
    ];
    let foundPath = null;
    let sql = null;
    for (const tryPath of tryPaths) {
      if (fs.existsSync(tryPath)) {
        foundPath = tryPath;
        sql = fs.readFileSync(tryPath, 'utf8');
        break;
      }
    }
    if (!sql) {
      return res.status(404).json({ error: 'Could not find schema.sql', pathsTried: tryPaths });
    }
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    await client.query(sql);
    await client.end();
    res.json({ success: true, message: 'Schema applied!', usedPath: foundPath });
  } catch (error) {
    res.status(500).json({ error: error.toString(), stack: error.stack });
  }
});

// Optional: /api/admin/set-admin-password?secret=...&pass=....&user=admin
const bcrypt = require('bcrypt');
router.post('/set-admin-password', async (req, res) => {
  try {
    if (req.query.secret !== ADMIN_SCHEMA_SECRET) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const user = req.query.user || 'admin';
    const pass = req.query.pass;
    if (!pass) return res.status(400).json({ error: 'No password provided' });
    const hash = await bcrypt.hash(pass, 12);
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await client.connect();
    const result = await client.query('UPDATE users SET password_hash=$1 WHERE username=$2 RETURNING id, email', [hash, user]);
    await client.end();
    res.json({ success: true, hash, user, updated: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: error.toString(), stack: error.stack });
  }
});

module.exports = router;