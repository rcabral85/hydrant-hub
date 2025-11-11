// Endpoint: Register Organization (Open Signup)
// Allows a new org/client to self-register and create an admin user

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const Joi = require('joi');
const bcrypt = require('bcrypt');

const orgSignupSchema = Joi.object({
  organization_name: Joi.string().min(2).max(255).required(),
  admin_email: Joi.string().email().required(),
  admin_password: Joi.string().min(8).max(50).required(),
  admin_first_name: Joi.string().max(100).required(),
  admin_last_name: Joi.string().max(100).required()
});

router.post('/signup', async (req, res) => {
  try {
    const { error, value } = orgSignupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details.map(d=>d.message) });
    }

    // Ensure uuid-ossp extension is enabled
    try {
      await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (extError) {
      console.log('UUID extension may already exist or permissions issue:', extError.message);
    }

    // Check if organization email already exists
    const existingOrg = await db.query(
      'SELECT id FROM organizations WHERE contact_email = $1',
      [value.admin_email]
    );
    if (existingOrg.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'An organization with this email already exists' 
      });
    }

    // Check if user email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [value.admin_email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'A user with this email already exists' 
      });
    }

    // Insert org
    const orgResult = await db.query(
      `INSERT INTO organizations (id, name, type, contact_email) 
       VALUES (uuid_generate_v4(), $1, 'CLIENT', $2) 
       RETURNING id, name`,
      [value.organization_name, value.admin_email]
    );
    const orgId = orgResult.rows[0].id;
    
    // Hash password
    const hash = await bcrypt.hash(value.admin_password, 12);
    
    // Generate username from email (before @ symbol)
    const username = value.admin_email.split('@')[0];
    
    // Insert admin user
    const userResult = await db.query(
      `INSERT INTO users (organization_id, username, email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', true)
       RETURNING id, email, first_name, last_name, role`,
      [orgId, username, value.admin_email, hash, value.admin_first_name, value.admin_last_name]
    );
    
    // Return success
    res.status(201).json({
      success: true,
      organization: orgResult.rows[0],
      user: userResult.rows[0],
      message: 'Organization and admin user created successfully! You can now log in.'
    });
  } catch (e) {
    console.error('Signup error:', e);
    
    // Provide more specific error messages
    if (e.code === '23505') { // Unique violation
      return res.status(409).json({ 
        success: false, 
        error: 'This email or username is already registered' 
      });
    }
    
    if (e.message && e.message.includes('uuid_generate_v4')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database configuration error. Please contact support.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed. Please try again later.' 
    });
  }
});

module.exports = router;