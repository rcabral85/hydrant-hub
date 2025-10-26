const express = require('express');
const Joi = require('joi');
const { query, getClient } = require('../config/database');
const calculations = require('../services/calculations');

const router = express.Router();

// Validation schemas
const outletSchema = Joi.object({
  pitotPressurePSI: Joi.number().min(0).max(300).required(),
  diameterInches: Joi.number().valid(2.5, 4.5, 6.0).required(),
  coefficientOfDischarge: Joi.number().min(0.70).max(0.90).default(0.90),
  hydrantId: Joi.number().integer().positive().required()
});

const flowTestSchema = Joi.object({
  testDate: Joi.date().iso().required(),
  testTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  testerId: Joi.number().integer().positive().required(),
  weatherConditions: Joi.string().max(500).optional(),
  temperatureCelsius: Joi.number().min(-50).max(60).optional(),
  testHydrantId: Joi.number().integer().positive().required(),
  staticPressurePSI: Joi.number().min(0).max(300).required(),
  residualPressurePSI: Joi.number().min(0).max(300).required(),
  outlets: Joi.array().items(outletSchema).min(1).max(6).required(),
  notes: Joi.string().max(2000).optional(),
  testHydrantLocation: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lon: Joi.number().min(-180).max(180).required()
  }).required(),
  flowHydrantLocations: Joi.array().items(
    Joi.object({
      hydrantId: Joi.number().integer().positive().required(),
      lat: Joi.number().min(-90).max(90).required(),
      lon: Joi.number().min(-180).max(180).required()
    })
  ).optional()
});

/**
 * @route   POST /api/flow-tests
 * @desc    Create a new NFPA 291 flow test with automatic calculations
 * @access  Private (TODO: add authentication middleware)
 */
router.post('/', async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = flowTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    const testData = value;
    
    // Validate that static pressure > residual pressure
    if (testData.staticPressurePSI <= testData.residualPressurePSI) {
      return res.status(400).json({
        error: 'Invalid pressure readings',
        details: 'Static pressure must be greater than residual pressure'
      });
    }
    
    // Perform NFPA 291 calculations
    const calculationResults = calculations.performFlowTestCalculation({
      staticPressurePSI: testData.staticPressurePSI,
      residualPressurePSI: testData.residualPressurePSI,
      outlets: testData.outlets,
      testHydrantLocation: testData.testHydrantLocation,
      flowHydrantLocations: testData.flowHydrantLocations || []
    });
    
    // TODO: Replace with actual organization_id from authenticated user
    const organizationId = 1;
    
    // Start database transaction
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Insert flow test record
      const flowTestQuery = `
        INSERT INTO flow_tests (
          organization_id, test_date, test_time, tester_id, weather_conditions,
          temperature_celsius, test_hydrant_id, static_pressure_psi, residual_pressure_psi,
          total_flow_gpm, available_flow_20psi_gpm, nfpa_classification, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      
      const flowTestResult = await client.query(flowTestQuery, [
        organizationId,
        testData.testDate,
        testData.testTime,
        testData.testerId,
        testData.weatherConditions,
        testData.temperatureCelsius,
        testData.testHydrantId,
        testData.staticPressurePSI,
        testData.residualPressurePSI,
        calculationResults.totalFlowGPM,
        calculationResults.availableFlow20PSI,
        calculationResults.nfpaClassification,
        testData.notes
      ]);
      
      const flowTestId = flowTestResult.rows[0].id;
      
      // Insert outlet records
      for (const outlet of calculationResults.outletFlows) {
        const outletQuery = `
          INSERT INTO flow_test_outlets (
            flow_test_id, flow_hydrant_id, outlet_diameter_inches,
            coefficient_discharge, pitot_pressure_psi, calculated_flow_gpm
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await client.query(outletQuery, [
          flowTestId,
          outlet.hydrantId,
          outlet.diameterInches,
          outlet.coefficientOfDischarge,
          outlet.pitotPressurePSI,
          outlet.calculatedFlowGPM
        ]);
      }
      
      // Update hydrant's flow classification and last test date
      const updateHydrantQuery = `
        UPDATE hydrants 
        SET nfpa_class = $1, available_flow_gpm = $2, last_flow_test_date = $3
        WHERE id = $4
      `;
      
      await client.query(updateHydrantQuery, [
        calculationResults.nfpaClassification,
        Math.round(calculationResults.availableFlow20PSI),
        testData.testDate,
        testData.testHydrantId
      ]);
      
      await client.query('COMMIT');
      
      // Return complete test results
      const response = {
        success: true,
        flowTest: flowTestResult.rows[0],
        calculations: calculationResults,
        summary: {
          totalFlowGPM: calculationResults.totalFlowGPM,
          availableFlowAt20PSI: calculationResults.availableFlow20PSI,
          nfpaClassification: calculationResults.nfpaClassification,
          colorCode: calculationResults.colorCode,
          pressureDrop: calculationResults.testConditions.pressureDropPSI
        }
      };
      
      res.status(201).json(response);
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Flow test creation error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/flow-tests
 * @desc    Get flow tests with pagination and filtering
 * @access  Private (TODO: add authentication middleware)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      hydrantId,
      testerId,
      startDate,
      endDate,
      nfpaClass
    } = req.query;
    
    // TODO: Get organization_id from authenticated user
    const organizationId = 1;
    
    // Build WHERE clause
    const conditions = ['ft.organization_id = $1'];
    const params = [organizationId];
    let paramIndex = 2;
    
    if (hydrantId) {
      conditions.push(`ft.test_hydrant_id = $${paramIndex}`);
      params.push(hydrantId);
      paramIndex++;
    }
    
    if (testerId) {
      conditions.push(`ft.tester_id = $${paramIndex}`);
      params.push(testerId);
      paramIndex++;
    }
    
    if (startDate) {
      conditions.push(`ft.test_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      conditions.push(`ft.test_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }
    
    if (nfpaClass) {
      conditions.push(`ft.nfpa_classification = $${paramIndex}`);
      params.push(nfpaClass);
      paramIndex++;
    }
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Query for flow tests with hydrant and tester details
    const flowTestsQuery = `
      SELECT 
        ft.*,
        h.hydrant_number,
        h.address as hydrant_address,
        ST_X(h.location::geometry) as hydrant_longitude,
        ST_Y(h.location::geometry) as hydrant_latitude,
        u.first_name || ' ' || u.last_name as tester_name
      FROM flow_tests ft
      LEFT JOIN hydrants h ON ft.test_hydrant_id = h.id
      LEFT JOIN users u ON ft.tester_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ft.test_date DESC, ft.test_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const flowTestsResult = await query(flowTestsQuery, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM flow_tests ft
      WHERE ${conditions.slice(0, -2).join(' AND ')}
    `;
    
    const countResult = await query(countQuery, params.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      success: true,
      data: flowTestsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      },
      filters: {
        hydrantId,
        testerId,
        startDate,
        endDate,
        nfpaClass
      }
    });
    
  } catch (error) {
    console.error('Flow tests retrieval error:', error);
    next(error);
  }
});

/**
 * @route   GET /api/flow-tests/:id
 * @desc    Get a specific flow test with detailed results
 * @access  Private (TODO: add authentication middleware)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // TODO: Get organization_id from authenticated user
    const organizationId = 1;
    
    // Get flow test with hydrant and tester details
    const flowTestQuery = `
      SELECT 
        ft.*,
        h.hydrant_number,
        h.address as hydrant_address,
        h.manufacturer,
        h.model,
        ST_X(h.location::geometry) as hydrant_longitude,
        ST_Y(h.location::geometry) as hydrant_latitude,
        u.first_name || ' ' || u.last_name as tester_name,
        u.certification_number as tester_certification
      FROM flow_tests ft
      LEFT JOIN hydrants h ON ft.test_hydrant_id = h.id
      LEFT JOIN users u ON ft.tester_id = u.id
      WHERE ft.id = $1 AND ft.organization_id = $2
    `;
    
    const flowTestResult = await query(flowTestQuery, [id, organizationId]);
    
    if (flowTestResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Flow test not found',
        details: `No flow test found with ID ${id}`
      });
    }
    
    // Get outlet details
    const outletsQuery = `
      SELECT 
        fto.*,
        h.hydrant_number as flow_hydrant_number,
        h.address as flow_hydrant_address
      FROM flow_test_outlets fto
      LEFT JOIN hydrants h ON fto.flow_hydrant_id = h.id
      WHERE fto.flow_test_id = $1
      ORDER BY fto.calculated_flow_gpm DESC
    `;
    
    const outletsResult = await query(outletsQuery, [id]);
    
    const flowTest = flowTestResult.rows[0];
    const outlets = outletsResult.rows;
    
    res.json({
      success: true,
      data: {
        ...flowTest,
        outlets
      }
    });
    
  } catch (error) {
    console.error('Flow test retrieval error:', error);
    next(error);
  }
});

/**
 * @route   POST /api/flow-tests/calculate
 * @desc    Calculate flow test results without saving (preview mode)
 * @access  Public
 */
router.post('/calculate', (req, res, next) => {
  try {
    // Simplified validation for calculation-only request
    const calculationSchema = Joi.object({
      staticPressurePSI: Joi.number().min(0).max(300).required(),
      residualPressurePSI: Joi.number().min(0).max(300).required(),
      outlets: Joi.array().items(
        Joi.object({
          pitotPressurePSI: Joi.number().min(0).max(300).required(),
          diameterInches: Joi.number().valid(2.5, 4.5, 6.0).required(),
          coefficientOfDischarge: Joi.number().min(0.70).max(0.90).default(0.90)
        })
      ).min(1).max(6).required()
    });
    
    const { error, value } = calculationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    const { staticPressurePSI, residualPressurePSI, outlets } = value;
    
    // Validate pressure readings
    if (staticPressurePSI <= residualPressurePSI) {
      return res.status(400).json({
        error: 'Invalid pressure readings',
        details: 'Static pressure must be greater than residual pressure'
      });
    }
    
    // Perform calculations
    const calculationResults = calculations.performFlowTestCalculation({
      staticPressurePSI,
      residualPressurePSI,
      outlets,
      testHydrantLocation: { lat: 0, lon: 0 }, // Not needed for calculation-only
      flowHydrantLocations: []
    });
    
    res.json({
      success: true,
      calculations: calculationResults,
      summary: {
        message: 'Calculations completed (preview mode - not saved)',
        totalFlowGPM: calculationResults.totalFlowGPM,
        availableFlowAt20PSI: calculationResults.availableFlow20PSI,
        nfpaClassification: calculationResults.nfpaClassification,
        colorCode: calculationResults.colorCode,
        pressureDrop: calculationResults.testConditions.pressureDropPSI
      }
    });
    
  } catch (error) {
    console.error('Flow calculation error:', error);
    next(error);
  }
});

module.exports = router;
