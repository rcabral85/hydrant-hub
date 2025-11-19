// HydrantHub Maintenance & Inspection API Routes
// Comprehensive maintenance system with audit compliance
// Supports O. Reg 169/03, NFPA 291, and AWWA M17 standards

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { attachOrgContext } = require('../middleware/orgContext');
const multer = require('multer');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/maintenance/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'maintenance-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Apply authentication and org context to all routes
router.use(authenticateToken, attachOrgContext);

// =============================================
// MAIN MAINTENANCE ENDPOINTS
// =============================================

// Get all maintenance records for organization
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, h.hydrant_id, h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1
      ORDER BY m.scheduled_date DESC
    `, [req.organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all inspections for organization
router.get('/inspections', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*, 
        h.hydrant_id, 
        h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1 
      AND m.maintenance_type = 'inspection'
      ORDER BY m.scheduled_date DESC
    `, [req.organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all work orders for organization
router.get('/work-orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*, 
        h.hydrant_id, 
        h.location
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1 
      AND m.maintenance_type IN ('repair', 'painting', 'lubrication', 'winterization', 'other')
      ORDER BY m.scheduled_date DESC
    `, [req.organizationId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get maintenance statistics for organization
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1
    `, [req.organizationId]);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get compliance schedule for organization
router.get('/compliance/schedule', async (req, res) => {
  try {
    const schedule = await pool.query(`
      SELECT 
        h.hydrant_id,
        h.location,
        h.last_inspection_date,
        CASE 
          WHEN h.last_inspection_date IS NULL THEN 'overdue'
          WHEN h.last_inspection_date < NOW() - INTERVAL '1 year' THEN 'overdue'
          WHEN h.last_inspection_date < NOW() - INTERVAL '9 months' THEN 'due_soon'
          ELSE 'compliant'
        END as compliance_status
      FROM hydrants h
      WHERE h.organization_id = $1
      ORDER BY h.last_inspection_date ASC NULLS FIRST
    `, [req.organizationId]);

    res.json(schedule.rows);
  } catch (error) {
    console.error('Error fetching compliance schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new maintenance record
router.post('/', async (req, res) => {
  try {
    const {
      hydrant_id,
      maintenance_type,
      description,
      status,
      scheduled_date,
      completed_date,
      technician,
      notes
    } = req.body;

    const result = await pool.query(`
      INSERT INTO maintenance (
        hydrant_id, maintenance_type, description, status,
        scheduled_date, completed_date, technician, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [hydrant_id, maintenance_type, description, status, scheduled_date, completed_date, technician, notes]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================
// INSPECTION MANAGEMENT
// =============================================

router.post('/inspections', 
  upload.array('photos', 10),
  [
    body('hydrant_id').notEmpty().withMessage('Hydrant ID is required'),
    body('inspection_type').notEmpty().withMessage('Valid inspection type required'),
    body('inspector_name').notEmpty().withMessage('Inspector name is required'),
    body('inspection_date').isISO8601().withMessage('Valid inspection date required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Set audit context
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user', req.user.username]);
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', req.user.userId]);

        const {
          hydrant_id,
          inspection_type,
          inspector_name,
          inspection_date,
          overall_status,
          overall_notes,
          paint_condition,
          body_condition,
          cap_condition,
          chains_present,
          clearance_adequate,
          valve_operation,
          static_pressure_psi,
          valve_leak_detected,
          immediate_action_required,
          safety_hazard_description,
          overall_condition,
          repair_needed,
          priority_level,
          inspector_notes
        } = req.body;

        // Create main inspection record
        const inspectionResult = await client.query(`
          INSERT INTO maintenance_inspections (
            hydrant_id, inspection_type, inspector_name,
            inspection_date, overall_status, inspector_notes,
            paint_condition, body_condition, cap_condition, chains_present, clearance_adequate,
            valve_operation, static_pressure_psi, valve_leak_detected, immediate_action_required,
            safety_hazard_description, overall_condition, repair_needed, priority_level,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          hydrant_id, 
          inspection_type || 'QUICK_MAINTENANCE', 
          inspector_name,
          inspection_date, 
          overall_status || 'COMPLETED', 
          inspector_notes || overall_notes,
          paint_condition,
          body_condition,
          cap_condition,
          chains_present,
          clearance_adequate,
          valve_operation,
          static_pressure_psi,
          valve_leak_detected,
          immediate_action_required,
          safety_hazard_description,
          overall_condition,
          repair_needed,
          priority_level
        ]);

        const inspection = inspectionResult.rows[0];

        // Create maintenance history entry
        await client.query(`
          INSERT INTO maintenance_history (
            hydrant_id, action_type, action_description, action_date,
            performed_by, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          hydrant_id,
          'INSPECTION',
          `${inspection_type || 'Quick Maintenance'} completed`,
          inspection_date,
          inspector_name,
          inspector_notes || overall_notes,
          req.user.userId
        ]);

        // Create work order if needed
        let workOrder = null;
        if (repair_needed || immediate_action_required) {
          const woResult = await client.query(
            `INSERT INTO work_orders (
              hydrant_id, inspection_id, priority, status, description, created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *;`,
            [
              hydrant_id,
              inspection.id,
              priority_level || 'MEDIUM',
              'OPEN',
              `Auto-generated from ${inspection_type}. ${inspector_notes || overall_notes || ''}`
            ]
          );
          workOrder = woResult.rows[0];
        }

        await client.query('COMMIT');
        
        res.status(201).json({
          success: true,
          message: 'Inspection created successfully',
          inspection: inspection,
          workOrder: workOrder
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error creating inspection:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create inspection',
        details: error.message 
      });
    }
  }
);

// Get maintenance inspections for a hydrant
router.get('/inspections/hydrant/:hydrantId',
  param('hydrantId').notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { hydrantId } = req.params;
      const { limit = 10, offset = 0, type = 'all' } = req.query;

      let whereClause = 'WHERE mi.hydrant_id = $1';
      let params = [hydrantId];
      
      if (type !== 'all') {
        whereClause += ' AND mi.inspection_type = $2';
        params.push(type);
      }

      const result = await pool.query(`
        SELECT mi.*
        FROM maintenance_inspections mi
        ${whereClause}
        ORDER BY mi.inspection_date DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      res.json({
        success: true,
        inspections: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Error fetching inspections:', error);
      res.status(500).json({ error: 'Failed to fetch inspections' });
    }
  }
);

module.exports = router;
