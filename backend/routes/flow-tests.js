const express = require('express');
const { db } = require('../config/database');
const NFPA291Calculator = require('../services/nfpa291Calculator');
const Joi = require('joi');
const router = express.Router();

// Initialize NFPA calculator
const calculator = new NFPA291Calculator();

// Helper to safely handle JSON/JSONB columns
function ensureParsedJSON(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

// Validation schemas
const outletSchema = Joi.object({
  size: Joi.number().positive().required(),
  pitotPressure: Joi.number().positive().required(),
  coefficient: Joi.number().min(0.7).max(1.0).optional()
});

const flowTestSchema = Joi.object({
  hydrant_id: Joi.string().uuid().required(),
  test_date: Joi.date().default(() => new Date()),
  test_time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  tester_id: Joi.string().uuid().optional(),
  weather_conditions: Joi.string().max(100).optional(),
  temperature_f: Joi.number().integer().min(-20).max(120).optional(),

  static_pressure_psi: Joi.number().positive().required(),
  residual_pressure_psi: Joi.number().positive().required(),
  outlets: Joi.array().items(outletSchema).min(1).required(),

  test_method: Joi.string().valid('pitot_gauge', 'flow_meter', 'weir').default('pitot_gauge'),
  notes: Joi.string().max(1000).optional()
});

// POST /api/flow-tests - Create new flow test with NFPA 291 calculations
router.post('/', async (req, res, next) => {
  try {
    // Validate input data
    const { error, value } = flowTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }

    const testData = value;

    // Verify hydrant exists
    const hydrantCheck = await db.query(
      'SELECT id, hydrant_number, organization_id FROM hydrants WHERE id = $1 AND status = $2',
      [testData.hydrant_id, 'active']
    );

    if (hydrantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Hydrant not found or inactive' });
    }

    // Perform NFPA 291 calculations
    const calculationResults = calculator.performFlowTest({
      staticPressure: testData.static_pressure_psi,
      residualPressure: testData.residual_pressure_psi,
      outlets: testData.outlets
    });

    // Generate test number
    const testNumber = `FT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Insert flow test record
    const insertQuery = `
      INSERT INTO flow_tests (
        organization_id, hydrant_id, test_number, test_date, tester_id,
        weather_conditions, temperature_f, static_pressure_psi, residual_pressure_psi,
        total_flow_gpm, available_flow_gpm, nfpa_class, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`;

    const insertValues = [
      hydrantCheck.rows[0].organization_id,
      testData.hydrant_id,
      testNumber,
      testData.test_date,
      testData.tester_id || null,
      testData.weather_conditions || null,
      testData.temperature_f || null,
      testData.static_pressure_psi,
      testData.residual_pressure_psi,
      calculationResults.results.totalFlow,
      calculationResults.results.availableFireFlow,
      calculationResults.results.classification.class,
      testData.notes || null
    ];

    const result = await db.query(insertQuery, insertValues);
    const flowTest = result.rows[0];

    // Update hydrant's last tested date and NFPA class
    await db.query(
      'UPDATE hydrants SET last_tested = $1, nfpa_class = $2, available_flow_gpm = $3, updated_at = NOW() WHERE id = $4',
      [testData.test_date, calculationResults.results.classification.class, calculationResults.results.availableFireFlow, testData.hydrant_id]
    );

    // Return complete results
    res.status(201).json({
      success: true,
      flowTest: flowTest,
      calculations: calculationResults,
      hydrant: hydrantCheck.rows[0]
    });

  } catch (error) {
    console.error('Flow test creation error:', error);
    next(error);
  }
});

// GET /api/flow-tests - List flow tests with filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      hydrant_id,
      organization_id,
      start_date,
      end_date,
      nfpa_class,
      tested_by,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        ft.*, 
        h.hydrant_number, 
        h.address as hydrant_address, 
        u.first_name || ' ' || u.last_name as tested_by_name
      FROM flow_tests ft
      LEFT JOIN hydrants h ON ft.hydrant_id = h.id
      LEFT JOIN users u ON ft.tested_by_user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (hydrant_id) {
      params.push(hydrant_id);
      query += ` AND ft.hydrant_id = $${++paramCount}`;
    }

    if (organization_id) {
      params.push(organization_id);
      query += ` AND h.organization_id = $${++paramCount}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND ft.test_date >= $${++paramCount}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND ft.test_date <= $${++paramCount}`;
    }

    if (nfpa_class) {
      params.push(nfpa_class);
      query += ` AND ft.nfpa_class = $${++paramCount}`;
    }

    if (tested_by) {
      params.push(tested_by);
      query += ` AND ft.tester_id = $${++paramCount}`;
    }

    query += ` ORDER BY ft.test_date DESC, ft.created_at DESC`;

    params.push(parseInt(limit));
    query += ` LIMIT $${++paramCount}`;

    params.push(parseInt(offset));
    query += ` OFFSET $${++paramCount}`;

    const result = await db.query(query, params);

    // Return flow tests
    const flowTests = result.rows;

    res.json({
      success: true,
      flowTests,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Flow tests retrieval error:', error);
    next(error);
  }
});

// GET /api/flow-tests/:id - Get specific flow test
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT 
        ft.*, 
        h.hydrant_number, 
        h.address as hydrant_address,
        u.first_name || ' ' || u.last_name as tested_by_name,
        o.name as organization_name
      FROM flow_tests ft
      LEFT JOIN hydrants h ON ft.hydrant_id = h.id
      LEFT JOIN users u ON ft.tested_by_user_id = u.id
      LEFT JOIN organizations o ON h.organization_id = o.id
      WHERE ft.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flow test not found' });
    }

    const flowTest = result.rows[0];

    res.json({
      success: true,
      flowTest: flowTest
    });

  } catch (error) {
    console.error('Flow test retrieval error:', error);
    next(error);
  }
});

// POST /api/flow-tests/:id/approve - Approve flow test
router.post('/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewed_by_user_id, notes } = req.body;

    if (!reviewed_by_user_id) {
      return res.status(400).json({ error: 'Reviewer user ID is required' });
    }

    const result = await db.query(
      `UPDATE flow_tests 
       SET approved = true, reviewed_by_user_id = $1, reviewed_at = NOW(), compliance_notes = $2, updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [reviewed_by_user_id, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Flow test not found' });
    }

    res.json({
      success: true,
      message: 'Flow test approved',
      flowTest: result.rows[0]
    });

  } catch (error) {
    console.error('Flow test approval error:', error);
    next(error);
  }
});

// Calculator test
router.post('/calculator/test', async (req, res, next) => {
  try {
    const { staticPressure, residualPressure, outlets } = req.body;

    if (!staticPressure || !residualPressure || !outlets) {
      return res.status(400).json({
        error: 'staticPressure, residualPressure, and outlets are required'
      });
    }

    const results = calculator.performFlowTest({
      staticPressure,
      residualPressure,
      outlets
    });

    res.json({
      success: true,
      results
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
