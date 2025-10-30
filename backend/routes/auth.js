const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (pool) => {
  router.post('/register', async (req, res) => {
    try {
      const { email, password, orgName } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
      const hash = await bcrypt.hash(password, 10);
      const orgResult = await pool.query('INSERT INTO organizations(name) VALUES($1) RETURNING id', [orgName || 'Default Org']);
      const orgId = orgResult.rows[0].id;
      const userResult = await pool.query(
        'INSERT INTO users(org_id, email, password_hash, role) VALUES($1,$2,$3,$4) RETURNING id,email,role,org_id',
        [orgId, email, hash, 'admin']
      );
      const user = userResult.rows[0];
      const token = jwt.sign({ sub: user.id, org: user.org_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ message: 'Email already in use' });
      console.error(e); res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const { rows } = await pool.query('SELECT id,email,password_hash,role,org_id FROM users WHERE email=$1', [email]);
      if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ sub: user.id, org: user.org_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Server error' }); }
  });

  return router;
};
