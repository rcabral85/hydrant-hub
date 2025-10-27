const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// GET /api/hydrants - list hydrants (for now, all rows)
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status
       FROM public."hydrants"
       ORDER BY id ASC`
    );
    res.json({ hydrants: result.rows });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
