const express = require('express');
const router = express.Router();

const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    req.user = payload; next();
  } catch { return res.status(401).json({ message: 'Invalid token' }); }
};

function calcQ(c, d, P) { return 29.83 * c * d * d * Math.sqrt(P); }
function calcQR(QF, PR, PF) { return QF * Math.pow(PR / PF, 0.54); }
function nfpaClass(gpm) { return gpm >= 1500 ? 'AA' : gpm >= 1000 ? 'A' : gpm >= 500 ? 'B' : 'C'; }

module.exports = (pool) => {
  router.get('/', requireAuth, async (req, res) => {
    const { org } = req.user;
    const { rows } = await pool.query('SELECT * FROM flow_tests WHERE org_id=$1 ORDER BY tested_at DESC', [org]);
    res.json(rows);
  });

  router.post('/', requireAuth, async (req, res) => {
    const { org } = req.user;
    const { hydrant_id, static_psi, residual_psi, pitot_psi, outlet_diameter_in = 2.5, outlet_coefficient = 0.9, notes } = req.body;
    const QF = calcQ(outlet_coefficient, outlet_diameter_in, pitot_psi);
    const flow20 = calcQR(QF, 20, residual_psi);
    const cls = nfpaClass(flow20);
    const { rows } = await pool.query(
      `INSERT INTO flow_tests(org_id, hydrant_id, static_psi, residual_psi, pitot_psi, total_flow_gpm, flow_at_20psi_gpm, nfpa_class, tester_id, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [org, hydrant_id, static_psi, residual_psi, pitot_psi, QF, flow20, cls, req.user.sub, notes || null]
    );
    res.status(201).json(rows[0]);
  });

  return router;
};
