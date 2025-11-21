// HydrantHub Backend - Enhanced Hydrant CRUD Routes
// Complete hydrant management with validation and maintenance integration
// Supports creation, updates, and enhanced querying for the upgraded frontend

const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const Joi = require('joi');
const { authenticateToken } = require('../middleware/auth');

// Enhanced validation schemas for the new frontend
const hydrantSchema = Joi.object({
  organization_id: Joi.string().uuid().optional(), // Make optional for simpler frontend
  hydrant_number: Joi.string().max(50).required(),
  manufacturer: Joi.string().max(100).optional(),
  model: Joi.string().max(100).optional(),
  year_installed: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().max(500).required(),
  location_description: Joi.string().max(1000).optional(),
  size_inches: Joi.number().positive().optional(),
  outlet_count: Joi.number().integer().positive().default(2),
  static_pressure_psi: Joi.number().positive().optional(),
  status: Joi.string().valid('active', 'out_of_service', 'maintenance_required', 'testing', 'decommissioned').default('active'),
  nfpa_class: Joi.string().valid('AA', 'A', 'B', 'C').optional(),
  notes: Joi.string().max(2000).optional(),
  created_by: Joi.string().max(100).optional(),
  updated_by: Joi.string().max(100).optional(),
  // Keep these for backward compatibility if frontend sends them
  location_address: Joi.string().max(500).optional(),
  operational_status: Joi.string().optional(),
  nfpa_classification: Joi.string().optional()
});

const hydrantUpdateSchema = hydrantSchema.fork(['hydrant_number', 'latitude', 'longitude', 'address'], (schema) => schema.optional());

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// GET /api/hydrants - List all hydrants with optional filtering (Enhanced for new frontend)
router.get('/', async (req, res, next) => {
  try {
    const {
      limit = 100,
      offset = 0,
      status,
      nfpa_class,
      municipality,
      search,
      near_lat,
      near_lon,
      radius_km = 10
    } = req.query;

    let query = `
      SELECT 
        h.*,
        h.status,
        h.address,
        h.nfpa_class,
        ft.total_flow_gpm as flow_rate_gpm,
        ft.test_date as last_flow_test_date,
        mi.inspection_date as last_inspection_date,
        mi.overall_status as last_inspection_status,
        (
          SELECT COUNT(*) FROM flow_tests ft2 WHERE ft2.hydrant_id = h.id
        ) as test_count
      FROM hydrants h
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id) 
          hydrant_id, total_flow_gpm, test_date
        FROM flow_tests 
        ORDER BY hydrant_id, test_date DESC
      ) ft ON h.id = ft.hydrant_id
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id)
          hydrant_id, inspection_date, overall_status
        FROM maintenance_inspections
        ORDER BY hydrant_id, inspection_date DESC
      ) mi ON h.id = mi.hydrant_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    // Add filters
    if (status) {
      paramCount++;
      query += ` AND h.status = $${paramCount}`;
      params.push(status);
    }

    if (nfpa_class) {
      paramCount++;
      query += ` AND h.nfpa_class = $${paramCount}`;
      params.push(nfpa_class);
    }

    if (search) {
      paramCount++;
      query += ` AND (h.hydrant_number ILIKE $${paramCount} OR h.address ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Spatial proximity search
    if (near_lat && near_lon) {
      const lat = parseFloat(near_lat);
      const lon = parseFloat(near_lon);
      const radiusKm = parseFloat(radius_km);

      // Rough bounding box calculation (1 degree ≈ 111 km)
      const latDelta = radiusKm / 111.0;
      const lonDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));

      paramCount += 4;
      query += ` AND h.latitude BETWEEN $${paramCount - 3} AND $${paramCount - 2} AND h.longitude BETWEEN $${paramCount - 1} AND $${paramCount}`;
      params.push(lat - latDelta, lat + latDelta, lon - lonDelta, lon + lonDelta);
    }

    query += ` ORDER BY h.hydrant_number`;

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await db.query(query, params);

    let hydrants = result.rows;

    // Apply precise distance filtering if location search was requested
    if (near_lat && near_lon) {
      const searchLat = parseFloat(near_lat);
      const searchLon = parseFloat(near_lon);
      const maxDistanceKm = parseFloat(radius_km);

      hydrants = hydrants
        .filter(h => {
          if (!h.latitude || !h.longitude) return false;
          const distance = calculateDistance(searchLat, searchLon, h.latitude, h.longitude);
          h.distance_km = Math.round(distance * 100) / 100;
          return distance <= maxDistanceKm;
        })
        .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    }

    res.json({
      success: true,
      hydrants,
      count: hydrants.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching hydrants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hydrants',
      error: error.message
    });
  }
});

// GET /api/hydrants/map/geojson - Get hydrants as GeoJSON for mapping (Enhanced)
router.get('/map/geojson', async (req, res, next) => {
  try {
    const { status, nfpa_class } = req.query;

    let query = `
      SELECT 
        h.id,
        h.hydrant_number,
        h.latitude,
        h.longitude,
        h.address,
        h.status as operational_status,
        h.nfpa_class,
        ft.total_flow_gpm as flow_rate_gpm,
        ft.static_pressure_psi,
        h.manufacturer,
        h.model,
        h.size_inches,
        h.year_installed,
        ft.test_date as last_flow_test_date,
        mi.inspection_date as last_inspection_date
      FROM hydrants h
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id) 
          hydrant_id, total_flow_gpm, static_pressure_psi, test_date
        FROM flow_tests 
        ORDER BY hydrant_id, test_date DESC
      ) ft ON h.id = ft.hydrant_id
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id)
          hydrant_id, inspection_date
        FROM maintenance_inspections
        ORDER BY hydrant_id, inspection_date DESC
      ) mi ON h.id = mi.hydrant_id
      WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL
    `;

    const params = [];
    let paramCount = 0;

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND h.status = $${paramCount}`;
      params.push(status);
    }

    if (nfpa_class) {
      paramCount++;
      query += ` AND h.nfpa_class = $${paramCount}`;
      params.push(nfpa_class);
    }

    query += ` ORDER BY h.hydrant_number`;

    const result = await db.query(query, params);

    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(hydrant => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(hydrant.longitude), parseFloat(hydrant.latitude)]
        },
        properties: {
          id: hydrant.id,
          hydrant_number: hydrant.hydrant_number,
          address: hydrant.address,
          location_address: hydrant.address,
          operational_status: hydrant.operational_status,
          status: hydrant.operational_status, // Alias for compatibility
          nfpa_class: hydrant.nfpa_class || 'C',
          nfpa_classification: hydrant.nfpa_class || 'C',
          flow_rate_gpm: hydrant.flow_rate_gpm,
          static_pressure_psi: hydrant.static_pressure_psi,
          manufacturer: hydrant.manufacturer,
          model: hydrant.model,
          watermain_size_mm: hydrant.watermain_size_mm,
          installation_date: hydrant.installation_date,
          last_flow_test_date: hydrant.last_flow_test_date,
          last_inspection_date: hydrant.last_inspection_date
        }
      }))
    };

    res.json({
      success: true,
      geojson
    });
  } catch (error) {
    console.error('Error fetching hydrant GeoJSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hydrant map data',
      error: error.message
    });
  }
});

// GET /api/hydrants/:id - Get single hydrant details (Enhanced)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        h.*,
        h.status,
        h.address,
        h.nfpa_class,
        ft.total_flow_gpm as flow_rate_gpm,
        ft.test_date as last_flow_test_date,
        mi.inspection_date as last_inspection_date,
        mi.overall_status as last_inspection_status,
        (
          SELECT COUNT(*) FROM flow_tests ft2 WHERE ft2.hydrant_id = h.id
        ) as test_count,
        (
          SELECT COUNT(*) FROM maintenance_inspections mi2 WHERE mi2.hydrant_id = h.id
        ) as inspection_count
      FROM hydrants h
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id) 
          hydrant_id, total_flow_gpm, test_date
        FROM flow_tests 
        ORDER BY hydrant_id, test_date DESC
      ) ft ON h.id = ft.hydrant_id
      LEFT JOIN (
        SELECT DISTINCT ON (hydrant_id)
          hydrant_id, inspection_date, overall_status
        FROM maintenance_inspections
        ORDER BY hydrant_id, inspection_date DESC
      ) mi ON h.id = mi.hydrant_id
      WHERE h.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hydrant not found'
      });
    }

    res.json({
      success: true,
      hydrant: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching hydrant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hydrant details',
      error: error.message
    });
  }
});

// POST /api/hydrants - Create new hydrant (Enhanced for new frontend)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Validate input data
    const { error, value } = hydrantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const hydrantData = value;

    // Check if hydrant number already exists
    const existingCheck = await db.query(
      'SELECT id FROM hydrants WHERE hydrant_number = $1',
      [hydrantData.hydrant_number]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Hydrant number ${hydrantData.hydrant_number} already exists`
      });
    }

    // Generate QR code for new hydrant
    const qrCode = `HH-${hydrantData.hydrant_number}-${Date.now().toString(36)}`;

    // Handle backward compatibility for field names
    const address = hydrantData.address || hydrantData.location_address;
    const status = hydrantData.status || hydrantData.operational_status || 'active';
    const nfpaClass = hydrantData.nfpa_class || hydrantData.nfpa_classification;

    // Insert new hydrant
    const insertQuery = `
      INSERT INTO hydrants (
        organization_id, hydrant_number, manufacturer, model, year_installed,
        latitude, longitude, address, size_inches, outlet_count,
        nfpa_class, status, notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
      ) RETURNING *
    `;

    // Get org_id from auth context
    const orgId = req.user.organization_id;

    const insertValues = [
      orgId,
      hydrantData.hydrant_number,
      hydrantData.manufacturer,
      hydrantData.model,
      hydrantData.year_installed || null,
      parseFloat(hydrantData.latitude),
      parseFloat(hydrantData.longitude),
      address,
      hydrantData.size_inches ? parseFloat(hydrantData.size_inches) : null,
      parseInt(hydrantData.outlet_count) || 2,
      nfpaClass,
      status,
      hydrantData.notes || null
    ];

    const result = await db.query(insertQuery, insertValues);

    res.status(201).json({
      success: true,
      message: 'Hydrant created successfully',
      hydrant: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating hydrant:', error);

    // Handle specific database errors
    if (error.code === '23505') { // unique violation
      return res.status(409).json({
        success: false,
        message: 'Hydrant number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create hydrant',
      error: error.message
    });
  }
});

// PUT /api/hydrants/:id - Update existing hydrant (Enhanced)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input data
    const { error, value } = hydrantUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
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
      return res.status(404).json({
        success: false,
        message: 'Hydrant not found'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [id]; // First parameter is always the ID
    let paramCount = 1;

    // Map of field names that might need conversion
    const fieldConversions = {
      latitude: (val) => parseFloat(val),
      longitude: (val) => parseFloat(val),
      watermain_size_mm: (val) => parseInt(val),
      static_pressure_psi: (val) => val ? parseFloat(val) : null
    };

    // Field mapping for backward compatibility
    const fieldMapping = {
      location_address: 'address',
      operational_status: 'status',
      nfpa_classification: 'nfpa_class'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        // Use mapped field name if available, otherwise use key
        const dbField = fieldMapping[key] || key;

        updateFields.push(`${dbField} = $${++paramCount}`);
        const convertedValue = fieldConversions[key] ? fieldConversions[key](value) : value;
        updateValues.push(convertedValue);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE hydrants 
      SET ${updateFields.join(', ')}
      WHERE id = $1
      RETURNING *`;

    const result = await db.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: 'Hydrant updated successfully',
      hydrant: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating hydrant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hydrant',
      error: error.message
    });
  }
});

// DELETE /api/hydrants/:id - Delete hydrant (soft delete) (Enhanced)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    // Check if hydrant exists
    const existsCheck = await db.query('SELECT id FROM hydrants WHERE id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hydrant not found'
      });
    }

    if (permanent === 'true') {
      // Permanent deletion (use with caution)
      const result = await db.query(
        'DELETE FROM hydrants WHERE id = $1 RETURNING *',
        [id]
      );

      res.json({
        success: true,
        message: 'Hydrant permanently deleted',
        hydrant: result.rows[0]
      });
    } else {
      // Soft delete by updating status
      const result = await db.query(
        `UPDATE hydrants 
         SET status = 'DECOMMISSIONED', 
             updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );

      res.json({
        success: true,
        message: 'Hydrant decommissioned successfully',
        hydrant: result.rows[0]
      });
    }
  } catch (error) {
    console.error('Error decommissioning hydrant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decommission hydrant',
      error: error.message
    });
  }
});

// GET /api/hydrants/:id/history - Get hydrant's test and inspection history (Enhanced)
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
        ft.nfpa_class,
        ft.static_pressure_psi,
        ft.operator_name as performed_by
      FROM flow_tests ft
      WHERE ft.hydrant_id = $1
      ORDER BY ft.test_date DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);

    // Get maintenance inspections
    const inspections = await db.query(`
      SELECT 
        'inspection' as type,
        mi.id,
        mi.inspection_date as date,
        mi.inspection_type as reference,
        mi.overall_condition,
        mi.overall_status,
        mi.inspector_name as performed_by
      FROM maintenance_inspections mi
      WHERE mi.hydrant_id = $1
      ORDER BY mi.inspection_date DESC
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hydrant history',
      error: error.message
    });
  }
});

module.exports = router;
