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

module.exports = (pool) => {
  router.get('/', requireAuth, async (req, res) => {
    const { org } = req.user;
    const { rows } = await pool.query('SELECT id, asset_id, street, city, status, outlet_diameter_in, outlet_coefficient, ST_AsGeoJSON(location) as location FROM hydrants WHERE org_id=$1 ORDER BY id DESC', [org]);
    res.json(rows);
  });

  router.post('/', requireAuth, async (req, res) => {
    const { org } = req.user;
    const { asset_id, lat, lng, street, city, status, outlet_diameter_in, outlet_coefficient, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO hydrants(org_id, asset_id, location, street, city, status, outlet_diameter_in, outlet_coefficient, notes)
       VALUES($1,$2, ST_GeogFromText($3), $4,$5,$6,$7,$8,$9) RETURNING *`,
      [org, asset_id, `POINT(${lng} ${lat})`, street, city, status || 'active', outlet_diameter_in || 2.5, outlet_coefficient || 0.9, notes || null]
    );
    res.status(201).json(rows[0]);
  });

  return router;
};
