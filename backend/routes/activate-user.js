// Backend: Activate invited user (with temporary password)
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const Joi = require('joi');
const bcrypt = require('bcrypt');

const activateSchema = Joi.object({
  email: Joi.string().email().required(),
  temp_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(50).required()
});

router.post('/', async (req, res) => {
  try {
    const { error, value } = activateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success:false, error: error.details.map(d=>d.message) });
    }
    // Find inactive user by email
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1 AND is_active = false', [value.email]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success:false, error: 'No inactive user found for that email.'});
    }
    const user = userCheck.rows[0];
    // Validate temp password
    const passValid = await bcrypt.compare(value.temp_password, user.password_hash);
    if (!passValid) {
      return res.status(401).json({ success:false, error: 'Temporary password incorrect.'});
    }
    // Set new password, activate
    const newHash = await bcrypt.hash(value.new_password, 12);
    await db.query('UPDATE users SET password_hash = $1, is_active = true WHERE email = $2', [newHash, value.email]);
    res.json({ success: true, message: 'Account activated. You can now log in with your new password.' });
  } catch(e) { res.status(500).json({ success:false, error:e.message }); }
});

module.exports = router;
