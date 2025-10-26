const express = require('express');
const Joi = require('joi');
const { query } = require('../config/database');

const router = express.Router();

// TODO: replace with real organization scoping via auth
const ORG_ID = 1;

const hydrantSchema = Joi.object({
  hydrant_number: Joi.string().max(100).required(),
  address: Joi.string().allow('', null),
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  manufacturer: Joi.string().allow('', null),
  model: Joi.string().allow('', null),
  hydrant_type: Joi.string().valid('dry_barrel', 'wet_barrel').allow(null),
  main_valve_size: Joi.number().min(0).max(24).allow(null),
  outlet_2_5_inch_count: Joi.number().integer().min(0).max(4).default(0),
  outlet_4_5_inch_count: Joi.number().integer().min(0).max(2).default(0),
  outlet_6_inch_count: Joi.number().integer().min(0).max(2).default(0),
  steamer_connection: Joi.boolean().default(false),
  status: Joi.string().valid('active', 'out_of_service', 'needs_repair', 'retired').default('active'),
  pressure_zone: Joi.string().allow('', null),
  watermain_size: Joi.number().min(0).max(60).allow(null),
  notes: Joi.string().allow('', null)
});

// Create hydrant
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = hydrantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: 'Validation failed', details: error.details });
    }

    // Check for unique hydrant number within org
    const exists = await query('SELECT 1 FROM hydrants WHERE organization_id=$1 AND hydrant_number=$2', [ORG_ID, value.hydrant_number]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'Hydrant number already exists for this organization' });
    }

    const insertSql = `
      INSERT INTO hydrants (
        organization_id, hydrant_number, location, address, street, manufacturer, model, hydrant_type, main_valve_size,
        outlet_2_5_inch_count, outlet_4_5_inch_count, outlet_6_inch_count, steamer_connection, status, pressure_zone, watermain_size, notes
      ) VALUES (
        $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const params = [
      ORG_ID,
      value.hydrant_number,
      value.lon, value.lat,
      value.address || null,
      null,
      value.manufacturer || null,
      value.model || null,
      value.hydrant_type || null,
      value.main_valve_size || null,
      value.outlet_2_5_inch_count,
      value.outlet_4_5_inch_count,
      value.outlet_6_inch_count,
      value.steamer_connection,
      value.status,
      value.pressure_zone || null,
      value.watermain_size || null,
      value.notes || null
    ];

    const result = await query(insertSql, params);
    const row = result.rows[0];

    // Map geog to lat/lon
    const out = {
      ...row,
      lat: value.lat,
      lon: value.lon
    };

    res.status(201).json({ success: true, data: out });
  } catch (err) {
    next(err);
  }
});

// List hydrants with filters and pagination
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, q, nfpa_class, status } = req.query;
    const conditions = ['organization_id = $1'];
    const params = [ORG_ID];
    let idx = 2;

    if (q) {
      conditions.push(`(hydrant_number ILIKE $${idx} OR address ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }
    if (nfpa_class) {
      conditions.push(`nfpa_class = $${idx}`);
      params.push(nfpa_class);
      idx++;
    }
    if (status) {
      conditions.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const sql = `
      SELECT 
        id, hydrant_number, address, status, nfpa_class, available_flow_gpm,
        ST_Y(location::geometry) AS lat,
        ST_X(location::geometry) AS lon,
        last_flow_test_date
      FROM hydrants
      ${where}
      ORDER BY hydrant_number ASC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
    const listParams = [...params, limit, offset];
    const rows = (await query(sql, listParams)).rows;

    const countSql = `SELECT COUNT(*)::int AS total FROM hydrants ${where}`;
    const total = (await query(countSql, params)).rows[0].total;

    res.json({ success: true, data: rows, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
});

// Update hydrant
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { error, value } = hydrantSchema.min(1).validate(req.body);
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details });

    // Build dynamic update
    const sets = [];
    const params = [id, ORG_ID];
    let idx = 3;

    const mapField = (field, column) => {
      if (value[field] !== undefined) {
        sets.push(`${column} = $${idx}`);
        params.push(value[field]);
        idx++;
      }
    };

    mapField('hydrant_number', 'hydrant_number');
    mapField('address', 'address');
    mapField('manufacturer', 'manufacturer');
    mapField('model', 'model');
    mapField('hydrant_type', 'hydrant_type');
    mapField('main_valve_size', 'main_valve_size');
    mapField('outlet_2_5_inch_count', 'outlet_2_5_inch_count');
    mapField('outlet_4_5_inch_count', 'outlet_4_5_inch_count');
    mapField('outlet_6_inch_count', 'outlet_6_inch_count');
    mapField('steamer_connection', 'steamer_connection');
    mapField('status', 'status');
    mapField('pressure_zone', 'pressure_zone');
    mapField('watermain_size', 'watermain_size');
    mapField('notes', 'notes');

    if (value.lat !== undefined && value.lon !== undefined) {
      sets.push(`location = ST_SetSRID(ST_MakePoint($${idx}, $${idx + 1}), 4326)::geography`);
      params.push(value.lon, value.lat);
      idx += 2;
    }

    if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const sql = `
      UPDATE hydrants SET ${sets.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND organization_id = $2
      RETURNING id, hydrant_number, address, status, nfpa_class, available_flow_gpm,
        ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lon, last_flow_test_date
    `;

    const result = await query(sql, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Hydrant not found' });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Delete hydrant (hard delete for now)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await query('DELETE FROM hydrants WHERE id=$1 AND organization_id=$2', [id, ORG_ID]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Hydrant not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
