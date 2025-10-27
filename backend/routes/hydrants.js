const express = require('express');
const { db } = require('../config/database');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const hydrantSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  hydrant_number: Joi.string().max(50).required(),
  address: Joi.string().max(500).optional(),
  manufacturer: Joi.string().max(100).optional(),
  model: Joi.string().max(100).optional(),
  year_installed: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  size_inches: Joi.number().positive().optional(),
  outlet_count: Joi.number().integer().min(1).max(10).default(2),
  outlet_sizes: Joi.array().items(Joi.object({
    size: Joi.number().positive().required(),
    count: Joi.number().integer().positive().required()
  })).optional(),
  steamer_size: Joi.number().positive().optional(),
  elevation_feet: Joi.number().optional(),
  water_main_size_inches: Joi.number().positive().optional(),
  valve_to_hydrant_feet: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive', 'removed', 'out_of_service').default('active'),
  notes: Joi.string().max(1000).optional(),
  // GPS coordinates
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

const hydrantUpdateSchema = hydrantSchema.fork(['organization_id', 'hydrant_number'], (schema) => schema.optional());

// GET /api/hydrants - List hydrants with filtering and spatial queries
router.get('/', async (req, res, next) => {
  try {
    const {
      organization_id,
      status = 'active',
      nfpa_class,
      search,
      near_lat,
      near_lng,
      radius_km = 10,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        h.*,
        ST_X(h.location) as longitude,
        ST_Y(h.location) as latitude,
        o.name as organization_name,
        (
          SELECT COUNT(*) FROM flow_tests ft WHERE ft.hydrant_id = h.id
        ) as test_count,
        (
          SELECT MAX(ft.test_date) FROM flow_tests ft WHERE ft.hydrant_id = h.id
        ) as last_test_date
      FROM hydrants h
      LEFT JOIN organizations o ON h.organization_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (organization_id) {
      params.push(organization_id);
      query += ` AND h.organization_id = $${++paramCount}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND h.status = $${++paramCount}`;
    }

    if (nfpa_class) {
      params.push(nfpa_class);
      query += ` AND h.nfpa_class = $${++paramCount}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (h.hydrant_number ILIKE $${++paramCount} OR h.address ILIKE $${paramCount})`;
    }

    // Spatial proximity search
    if (near_lat && near_lng) {
      params.push(parseFloat(near_lng), parseFloat(near_lat), parseFloat(radius_km) * 1000);
      query += ` AND ST_DWithin(
        h.location, 
        ST_SetSRID(ST_MakePoint($${++paramCount}, $${++paramCount}), 4326)::geography,
        $${++paramCount}
      )`;
    }

    query += ` ORDER BY h.hydrant_number ASC`;
    
    params.push(parseInt(limit));
    query += ` LIMIT $${++paramCount}`;
    
    params.push(parseInt(offset));
    query += ` OFFSET $${++paramCount}`;

    const result = await db.query(query, params);
    
    // Parse JSON fields
    const hydrants = result.rows.map(row => ({
      ...row,
      outlet_sizes: typeof row.outlet_sizes === 'string' ? JSON.parse(row.outlet_sizes) : row.outlet_sizes
    }));

    res.json({
      success: true,
      hydrants,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Hydrants listing error:', error);
    next(error);
  }
});

// GET /api/hydrants/:id - Get specific hydrant with full details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        h.*,
        ST_X(h.location) as longitude,
        ST_Y(h.location) as latitude,
        o.name as organization_name,
        o.type as organization_type,
        (
          SELECT COUNT(*) FROM flow_tests ft WHERE ft.hydrant_id = h.id
        ) as test_count,
        (
          SELECT COUNT(*) FROM inspections i WHERE i.hydrant_id = h.id
        ) as inspection_count,
        (
          SELECT MAX(ft.test_date) FROM flow_tests ft WHERE ft.hydrant_id = h.id
        ) as last_test_date,
        (
          SELECT MAX(i.inspection_date) FROM inspections i WHERE i.hydrant_id = h.id
        ) as last_inspection_date
      FROM hydrants h
      LEFT JOIN organizations o ON h.organization_id = o.id
      WHERE h.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hydrant not found' });
    }

    const hydrant = result.rows[0];
    
    res.json({
      success: true,
      hydrant: {
        ...hydrant,
        outlet_sizes: typeof hydrant.outlet_sizes === 'string' ? JSON.parse(hydrant.outlet_sizes) : hydrant.outlet_sizes
      }
    });

  } catch (error) {
    console.error('Hydrant retrieval error:', error);
    next(error);
  }
});

// POST /api/hydrants - Create new hydrant
router.post('/', async (req, res, next) => {
  try {
    // Validate input data
    const { error, value } = hydrantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const hydrantData = value;
    
    // Check if hydrant number already exists for this organization
    const existingCheck = await db.query(
      'SELECT id FROM hydrants WHERE organization_id = $1 AND hydrant_number = $2',
      [hydrantData.organization_id, hydrantData.hydrant_number]
    );
    
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Hydrant number already exists for this organization' 
      });
    }

    // Verify organization exists
    const orgCheck = await db.query(
      'SELECT id, name FROM organizations WHERE id = $1',
      [hydrantData.organization_id]
    );
    
    if (orgCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Generate QR code
    const qrCode = `HH-${hydrantData.hydrant_number}-${Date.now().toString(36)}`;

    // Build location point if coordinates provided
    let locationValue = null;
    let locationParam = null;
    if (hydrantData.latitude && hydrantData.longitude) {
      locationParam = `ST_SetSRID(ST_MakePoint($${13}, $${14}), 4326)`;
      locationValue = [hydrantData.longitude, hydrantData.latitude];
    }

    const insertQuery = `
      INSERT INTO hydrants (
        organization_id, hydrant_number, location, address, manufacturer, model, 
        year_installed, size_inches, outlet_count, outlet_sizes, steamer_size,
        elevation_feet, water_main_size_inches, valve_to_hydrant_feet, 
        status, notes, qr_code
      ) VALUES (
        $1, $2, ${locationParam || 'NULL'}, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *`;

    const insertValues = [
      hydrantData.organization_id,
      hydrantData.hydrant_number,
      hydrantData.address,
      hydrantData.manufacturer,
      hydrantData.model,
      hydrantData.year_installed,
      hydrantData.size_inches,
      hydrantData.outlet_count,
      JSON.stringify(hydrantData.outlet_sizes || []),
      hydrantData.steamer_size,
      hydrantData.elevation_feet,
      hydrantData.water_main_size_inches,
      hydrantData.valve_to_hydrant_feet,
      hydrantData.status,
      hydrantData.notes,
      qrCode
    ];

    if (locationValue) {
      insertValues.push(...locationValue);
    }

    const result = await db.query(insertQuery, insertValues);
    const hydrant = result.rows[0];

    res.status(201).json({
      success: true,
      hydrant: {
        ...hydrant,
        outlet_sizes: JSON.parse(hydrant.outlet_sizes || '[]'),
        longitude: hydrantData.longitude,
        latitude: hydrantData.latitude
      },
      organization: orgCheck.rows[0]
    });

  } catch (error) {
    console.error('Hydrant creation error:', error);
    next(error);
  }
});

// PUT /api/hydrants/:id - Update hydrant
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate input data
    const { error, value } = hydrantUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const updates = value;
    
    // Check if hydrant exists
    const existingHydrant = await db.query(
      'SELECT * FROM hydrants WHERE id = $1',
      [id]
    );
    
    if (existingHydrant.rows.length === 0) {
      return res.status(404).json({ error: 'Hydrant not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [id]; // First parameter is always the ID
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'latitude' && key !== 'longitude') {
        updateFields.push(`${key} = $${++paramCount}`);
        updateValues.push(key === 'outlet_sizes' ? JSON.stringify(value) : value);
      }
    }

    // Handle location update if coordinates provided
    if (updates.latitude && updates.longitude) {
      updateFields.push(`location = ST_SetSRID(ST_MakePoint($${++paramCount}, $${++paramCount}), 4326)`);
      updateValues.push(updates.longitude, updates.latitude);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE hydrants 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *`;

    const result = await db.query(updateQuery, updateValues);
    const hydrant = result.rows[0];

    res.json({
      success: true,
      hydrant: {
        ...hydrant,
        outlet_sizes: JSON.parse(hydrant.outlet_sizes || '[]')
      }
    });

  } catch (error) {
    console.error('Hydrant update error:', error);
    next(error);
  }
});

// DELETE /api/hydrants/:id - Soft delete hydrant (set status to removed)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Permanent deletion (use with caution)
      const result = await db.query(
        'DELETE FROM hydrants WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Hydrant not found' });
      }

      res.json({
        success: true,
        message: 'Hydrant permanently deleted',
        hydrant: result.rows[0]
      });
    } else {
      // Soft delete - set status to removed
      const result = await db.query(
        'UPDATE hydrants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['removed', id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Hydrant not found' });
      }

      res.json({
        success: true,
        message: 'Hydrant marked as removed',
        hydrant: result.rows[0]
      });
    }

  } catch (error) {
    console.error('Hydrant deletion error:', error);
    next(error);
  }
});

// GET /api/hydrants/:id/history - Get hydrant's test and inspection history
router.get('/:id/history', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get flow tests
    const flowTests = await db.query(`
      SELECT 
        'flow_test' as type,
        ft.id,
        ft.test_date as date,
        ft.test_number as reference,
        ft.total_flow_gpm,
        ft.available_fire_flow_gpm,
        ft.nfpa_class,
        u.first_name || ' ' || u.last_name as performed_by
      FROM flow_tests ft
      LEFT JOIN users u ON ft.tested_by_user_id = u.id
      WHERE ft.hydrant_id = $1
      ORDER BY ft.test_date DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);

    // Get inspections
    const inspections = await db.query(`
      SELECT 
        'inspection' as type,
        i.id,
        i.inspection_date as date,
        i.inspection_type as reference,
        i.overall_condition,
        i.maintenance_required,
        u.first_name || ' ' || u.last_name as performed_by
      FROM inspections i
      LEFT JOIN users u ON i.inspector_user_id = u.id
      WHERE i.hydrant_id = $1
      ORDER BY i.inspection_date DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);

    // Combine and sort by date
    const history = [...flowTests.rows, ...inspections.rows]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: history.length
      }
    });

  } catch (error) {
    console.error('Hydrant history error:', error);
    next(error);
  }
});

// GET /api/hydrants/map/geojson - Get hydrants as GeoJSON for mapping
router.get('/map/geojson', async (req, res, next) => {
  try {
    const { organization_id, status = 'active', nfpa_class } = req.query;

    let query = `
      SELECT 
        h.id,
        h.hydrant_number,
        h.address,
        h.nfpa_class,
        h.available_flow_gpm,
        h.status,
        ST_AsGeoJSON(h.location) as geometry
      FROM hydrants h
      WHERE h.location IS NOT NULL
    `;
    
    const params = [];
    let paramCount = 0;

    if (organization_id) {
      params.push(organization_id);
      query += ` AND h.organization_id = $${++paramCount}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND h.status = $${++paramCount}`;
    }

    if (nfpa_class) {
      params.push(nfpa_class);
      query += ` AND h.nfpa_class = $${++paramCount}`;
    }

    const result = await db.query(query, params);
    
    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        geometry: JSON.parse(row.geometry),
        properties: {
          id: row.id,
          hydrant_number: row.hydrant_number,
          address: row.address,
          nfpa_class: row.nfpa_class,
          available_flow_gpm: row.available_flow_gpm,
          status: row.status
        }
      }))
    };

    res.json({
      success: true,
      geojson
    });

  } catch (error) {
    console.error('GeoJSON generation error:', error);
    next(error);
  }
});

module.exports = router;