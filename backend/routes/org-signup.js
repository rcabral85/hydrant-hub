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
    // Insert org
    const orgResult = await db.query(
      `INSERT INTO organizations (id, name, type, contact_email) VALUES (uuid_generate_v4(), $1, 'CLIENT', $2) RETURNING id,name`,
      [value.organization_name, value.admin_email]
    );
    const orgId = orgResult.rows[0].id;
    // Hash password
    const hash = await bcrypt.hash(value.admin_password, 12);
    // Insert admin user
    const userResult = await db.query(
      `INSERT INTO users (organization_id, username, email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, 'admin', true)
      RETURNING id, email, first_name, last_name, role`,
      [orgId, value.admin_email.split('@')[0], value.admin_email, hash, value.admin_first_name, value.admin_last_name]
    );
    // Return success, send email (TODO: email integration)
    res.status(201).json({
      success: true,
      organization: orgResult.rows[0],
      user: userResult.rows[0],
      message: 'Organization and admin user created. You can now log in and add hydrants!'
    });
  } catch (e) {
    console.error('Signup error:',e);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
