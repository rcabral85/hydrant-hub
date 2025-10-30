const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  identifier: Joi.string().min(3).max(255).required(), // username or email
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  role: Joi.string().valid('admin', 'operator', 'supervisor', 'viewer', 'fire_inspector').default('operator'),
  phone: Joi.string().pattern(/^[\d\-\+\(\)\s]+$/).optional()
});

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      organization_id: user.organization_id
    },
    process.env.JWT_SECRET || 'fallback-secret-change-this',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

// POST /api/auth/login - User login (identifier can be username OR email)
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const { identifier, password } = value;

    // Try to find by username first
    let result = await db.query(
      `SELECT u.*, o.name as organization_name, o.type as organization_type
       FROM users u
       LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.username = $1 AND u.is_active = true`,
      [identifier]
    );

    // If not found, try by email
    if (result.rows.length === 0) {
      result = await db.query(
        `SELECT u.*, o.name as organization_name, o.type as organization_type
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.email = $1 AND u.is_active = true`,
        [identifier]
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const user = result.rows[0];

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ success: true, message: 'Login successful', token, user: userWithoutPassword });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// TEMP: Admin username/email check (remove after login works)
router.get('/whois-admin', async (req, res, next) => {
  try {
    const token = req.query.token;
    const EXPECTED = process.env.ADMIN_RESET_TOKEN || 'TRIDENT-RESET-ONLY-ONCE';
    if (!token || token !== EXPECTED) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const r = await db.query(
      `SELECT id, username, email, role, is_active FROM users WHERE email = 'admin@tridentsys.ca'`
    );

    if (r.rows.length === 0) return res.status(404).json({ error: 'Admin not found' });

    res.json({ success: true, admin: r.rows[0] });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/register - User registration
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const userData = value;

    const existingUser = await db.query(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [userData.username, userData.email]
    );

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      const field = existing.username === userData.username ? 'username' : 'email';
      return res.status(409).json({ error: `${field} already exists` });
    }

    const orgCheck = await db.query('SELECT id, name FROM organizations WHERE id = $1', [userData.organization_id]);
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const insertResult = await db.query(
      `INSERT INTO users (
        organization_id, username, email, password_hash, 
        first_name, last_name, role, phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, organization_id, username, email, first_name, last_name, role, phone, is_active, created_at`,
      [
        userData.organization_id,
        userData.username,
        userData.email,
        passwordHash,
        userData.first_name,
        userData.last_name,
        userData.role,
        userData.phone
      ]
    );

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { ...newUser, organization_name: orgCheck.rows[0].name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// Other routes (refresh, logout, me, profile) remain unchanged below...

module.exports = router;
