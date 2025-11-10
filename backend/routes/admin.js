const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { db } = require('../config/database');
const Joi = require('joi');
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

// POST /api/admin/organizations - Create new organization (public endpoint for registration)
const organizationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  type: Joi.string().valid(
    'municipality', 
    'fire_department', 
    'water_utility', 
    'contractor', 
    'property_management', 
    'other'
  ).required(),
  address: Joi.string().max(500).optional().allow(null, ''),
  contact_phone: Joi.string().max(50).optional().allow(null, ''),
  contact_email: Joi.string().email().optional().allow(null, '')
});

router.post('/organizations', async (req, res, next) => {
  try {
    const { error, value } = organizationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const orgData = value;

    // Check if organization already exists
    const existingOrg = await db.query(
      'SELECT id, name FROM organizations WHERE LOWER(name) = LOWER($1)',
      [orgData.name]
    );

    if (existingOrg.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Organization with this name already exists',
        existing_id: existingOrg.rows[0].id 
      });
    }

    // Create organization
    const result = await db.query(
      `INSERT INTO organizations (name, type, address, contact_phone, contact_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        orgData.name,
        orgData.type,
        orgData.address || null,
        orgData.contact_phone || null,
        orgData.contact_email || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: result.rows[0]
    });
  } catch (error) {
    console.error('Organization creation error:', error);
    next(error);
  }
});

// GET /api/admin/organizations - List organizations (optional for debugging)
router.get('/organizations', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, type, address, contact_phone, contact_email, created_at FROM organizations ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      count: result.rows.length,
      organizations: result.rows
    });
  } catch (error) {
    console.error('List organizations error:', error);
    next(error);
  }
});

module.exports = router;