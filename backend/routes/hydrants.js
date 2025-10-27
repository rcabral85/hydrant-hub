const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// List hydrants
router.get('/', async (req, res, next) => {
  try {
    console.log('HIT /api/hydrants GET');
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

// Create hydrant
router.post('/', async (req, res, next) => {
  try {
    const { organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status } = req.body;
    if (!organization_id || !hydrant_number) return res.status(400).json({ error: 'organization_id and hydrant_number are required' });
    const result = await query(
      `INSERT INTO public."hydrants" (organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status`,
      [organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status]
    );
    res.status(201).json({ hydrant: result.rows[0] });
  } catch (e) { next(e); }
});

// Update hydrant
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status } = req.body;
    const result = await query(
      `UPDATE public."hydrants"
       SET hydrant_number = COALESCE($2, hydrant_number),
           lat = COALESCE($3, lat),
           lon = COALESCE($4, lon),
           address = COALESCE($5, address),
           nfpa_class = COALESCE($6, nfpa_class),
           available_flow_gpm = COALESCE($7, available_flow_gpm),
           status = COALESCE($8, status)
       WHERE id = $1
       RETURNING id, organization_id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status`,
      [id, hydrant_number, lat, lon, address, nfpa_class, available_flow_gpm, status]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ hydrant: result.rows[0] });
  } catch (e) { next(e); }
});

// Delete hydrant
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await query(`DELETE FROM public."hydrants" WHERE id = $1`, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { next(e); }
});

module.exports = router;
