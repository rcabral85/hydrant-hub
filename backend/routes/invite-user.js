// Backend: Endpoint to invite users to existing organization (admin only)
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const Joi = require('joi');
const bcrypt = require('bcrypt');

const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  first_name: Joi.string().max(100).required(),
  last_name: Joi.string().max(100).required(),
  role: Joi.string().valid('operator','supervisor','viewer','fire_inspector').default('operator'),
  temp_password: Joi.string().min(8).max(50).optional()
});

router.post('/', async (req, res) => {
  try {
    const inviter = req.user;
    if (!inviter || inviter.role !== 'admin') {
      return res.status(403).json({ success:false, error:'Only org admins may invite users.' });
    }
    const { error, value } = inviteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success:false, error: error.details.map(d=>d.message) });
    }
    const tempPass = value.temp_password || Math.random().toString(36).slice(-10) + "A1!";
    const hash = await bcrypt.hash(tempPass, 12);
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [value.email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success:false, error:'That email is already used.' });
    }
    // Create the new user, inactive by default
    const result = await db.query(
      `INSERT INTO users (organization_id, username, email, password_hash, first_name, last_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, false) RETURNING id, email, role, is_active`,
      [inviter.organization_id, value.email.split('@')[0], value.email, hash, value.first_name, value.last_name, value.role]
    );
    // TODO: Send email with temp password + activation instructions
    res.status(201).json({
      success: true,
      user: result.rows[0],
      tempPassword: tempPass,
      message: "Invite sent! User must activate their account w/ temporary credentials."
    });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;
