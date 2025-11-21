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
  role: Joi.string().valid('admin', 'operator').default('operator'),
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
      organization_id: user.organization_id,
      is_superadmin: user.is_superadmin || false
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
      RETURNING id, organization_id, username, email, first_name, last_name, role, phone, is_active, is_superadmin, created_at`,
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

// POST /api/auth/refresh - Refresh JWT token
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');

      const result = await db.query(
        `SELECT u.*, o.name as organization_name, o.type as organization_type
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1 AND u.is_active = true`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const user = result.rows[0];
      const newToken = generateToken(user);

      const { password_hash, ...userWithoutPassword } = user;

      res.json({ success: true, token: newToken, user: userWithoutPassword });

    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    next(error);
  }
});

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please remove token from client.'
  });
});

// GET /api/auth/me - Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');

      const result = await db.query(
        `SELECT u.*, o.name as organization_name, o.type as organization_type, o.email as organization_email
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1 AND u.is_active = true`,
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      const { password_hash, ...userWithoutPassword } = result.rows[0];

      res.json({ success: true, user: userWithoutPassword });

    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('Profile retrieval error:', error);
    next(error);
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');

    const profileUpdateSchema = Joi.object({
      first_name: Joi.string().max(100).optional(),
      last_name: Joi.string().max(100).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().pattern(/^[\d\-\+\(\)\s]+$/).optional()
    });

    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const updates = value;

    if (updates.email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [updates.email, decoded.id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    const updateFields = [];
    const updateValues = [decoded.id];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updateFields.push(`${key} = $${++paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND is_active = true
      RETURNING id, organization_id, username, email, first_name, last_name, role, phone, is_superadmin, updated_at`;

    const result = await db.query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Profile update error:', error);
    next(error);
  }
});

module.exports = router;
