const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Create flow test with NFPA 291 calc to 20 psi
router.post('/', async (req, res, next) => {
  try {
    const { hydrant_id, static_psi, residual_psi, total_flow_gpm } = req.body;
    if (!hydrant_id || !static_psi || !residual_psi || !total_flow_gpm) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // NFPA 291: Qf = Qr * ((Pf - 20) / (Pf - Pr))^0.54
    const Pf = Number(static_psi);
    const Pr = Number(residual_psi);
    const Qr = Number(total_flow_gpm);

    if (Pf <= 20 || Pf <= Pr) {
      return res.status(400).json({ error: 'Invalid pressures: require static > residual and static > 20' });
    }

    const Qf = Qr * Math.pow(((Pf - 20) / (Pf - Pr)), 0.54);

    const result = await query(
      `INSERT INTO public."flow_tests" (hydrant_id, static_psi, residual_psi, total_flow_gpm, calc_at_20psi_gpm)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, hydrant_id, static_psi, residual_psi, total_flow_gpm, calc_at_20psi_gpm, created_at`,
      [hydrant_id, Pf, Pr, Qr, Qf]
    );

    res.status(201).json({ flow_test: result.rows[0] });
  } catch (e) {
    next(e);
  }
});

// List flow tests per hydrant
router.get('/', async (req, res, next) => {
  try {
    const { hydrant_id } = req.query;
    if (!hydrant_id) return res.status(400).json({ error: 'hydrant_id is required' });
    const result = await query(
      `SELECT id, hydrant_id, static_psi, residual_psi, total_flow_gpm, calc_at_20psi_gpm, created_at
       FROM public."flow_tests"
       WHERE hydrant_id = $1
       ORDER BY created_at DESC`,
      [hydrant_id]
    );
    res.json({ flow_tests: result.rows });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
