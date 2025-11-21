// HydrantHub Maintenance & Inspection API Routes
// Comprehensive maintenance system with audit compliance
// Supports O. Reg 169/03, NFPA 291, and AWWA M17 standards

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const orgContext = require('../middleware/orgContext'); // From PR #33
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

// =============================================
// INSPECTION MANAGEMENT
// =============================================

router.post('/inspections',
  authMiddleware,
  orgContext, // From PR #33
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
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', req.user.id]);

        const {
          hydrant_id,
          inspection_type,
          inspector_name,
          // inspector_license,  // ❌ REMOVE THIS - column doesn't exist
          inspection_date,
          overall_status,
          overall_notes,
          // Quick maintenance fields
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

        // Create main inspection record - REMOVE inspector_license
        const inspectionResult = await client.query(`
          INSERT INTO maintenance_inspections (
            hydrant_id, inspection_type, inspector_name,
            inspection_date, overall_status, inspector_notes,
            paint_condition, body_condition, cap_condition, chains_present, clearance_adequate,
            valve_operation, static_pressure_psi, valve_leak_detected, immediate_action_required,
            safety_hazard_description, overall_condition, repair_needed, priority_level,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
          req.user.id
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
  authMiddleware,
  orgContext, // From PR #33
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
        whereClause += ' AND it.name = $2';
        params.push(type);
      }

      const result = await pool.query(`
        SELECT 
          mi.*,
          
          -- Visual Inspection Data
          vi.paint_condition,
          vi.cap_condition,
          vi.barrel_condition,
          vi.chain_condition,
          vi.repair_needed,
          vi.priority,
          
          -- Valve Inspection Data
          vale.main_valve_operation,
          vale.static_pressure_psi,
          vale.valve_exercised,
          vale.repair_recommendations,
          vale.priority_level,
          
          -- Work Orders Generated
          array_agg(
            CASE WHEN rwo.id IS NOT NULL THEN
              json_build_object(
                'id', rwo.id,
                'work_order_number', rwo.work_order_number,
                'title', rwo.title,
                'priority', rwo.priority,
                'status', rwo.status,
                'scheduled_date', rwo.scheduled_date
              )
            END
          ) FILTER (WHERE rwo.id IS NOT NULL) as work_orders
          
        FROM maintenance_inspections mi
        LEFT JOIN visual_inspections vi ON mi.id = vi.maintenance_inspection_id
        LEFT JOIN valve_inspections vale ON mi.id = vale.maintenance_inspection_id
        LEFT JOIN repair_work_orders rwo ON mi.id = rwo.maintenance_inspection_id
        ${whereClause}
        GROUP BY mi.id,
                 vi.paint_condition, vi.cap_condition, vi.barrel_condition, vi.chain_condition,
                 vi.repair_needed, vi.priority, vale.main_valve_operation,
                 vale.static_pressure_psi, vale.valve_exercised, vale.repair_recommendations, vale.priority_level
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

// =============================================
// VISUAL INSPECTION MODULE
// =============================================

// Create/Update visual inspection
router.post('/inspections/:inspectionId/visual',
  authMiddleware,
  orgContext, // From PR #33
  upload.array('condition_photos', 15),
  [
    param('inspectionId').isInt().withMessage('Valid inspection ID required'),
    body('paint_condition').optional().isIn(['GOOD', 'FAIR', 'POOR']),
    body('barrel_condition').optional().isIn(['GOOD', 'FAIR', 'POOR']),
    body('cap_condition').optional().isIn(['GOOD', 'DAMAGED', 'MISSING'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { inspectionId } = req.params;
      const photoUrls = req.files ? req.files.map(file => `/uploads/maintenance/${file.filename}`) : [];

      const {
        paint_condition, paint_color, paint_notes,
        cap_condition, cap_type, cap_secure, cap_notes,
        barrel_condition, barrel_damage, barrel_notes,
        nozzle_caps_present, nozzle_caps_condition, nozzle_caps_notes,
        chain_present, chain_condition, chain_notes,
        repair_needed, priority
      } = req.body;

      const result = await pool.query(`
        INSERT INTO visual_inspections (
          maintenance_inspection_id, paint_condition, paint_color, paint_notes,
          cap_condition, cap_type, cap_secure, cap_notes,
          barrel_condition, barrel_damage, barrel_notes,
          nozzle_caps_present, nozzle_caps_condition, nozzle_caps_notes,
          chain_present, chain_condition, chain_notes,
          repair_needed, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (maintenance_inspection_id) 
        DO UPDATE SET
          paint_condition = EXCLUDED.paint_condition,
          paint_color = EXCLUDED.paint_color,
          paint_notes = EXCLUDED.paint_notes,
          cap_condition = EXCLUDED.cap_condition,
          cap_type = EXCLUDED.cap_type,
          cap_secure = EXCLUDED.cap_secure,
          cap_notes = EXCLUDED.cap_notes,
          barrel_condition = EXCLUDED.barrel_condition,
          barrel_damage = EXCLUDED.barrel_damage,
          barrel_notes = EXCLUDED.barrel_notes,
          nozzle_caps_present = EXCLUDED.nozzle_caps_present,
          nozzle_caps_condition = EXCLUDED.nozzle_caps_condition,
          nozzle_caps_notes = EXCLUDED.nozzle_caps_notes,
          chain_present = EXCLUDED.chain_present,
          chain_condition = EXCLUDED.chain_condition,
          chain_notes = EXCLUDED.chain_notes,
          repair_needed = EXCLUDED.repair_needed,
          priority = EXCLUDED.priority
        RETURNING *
      `, [
        inspectionId, paint_condition, paint_color, paint_notes,
        cap_condition, cap_type, cap_secure, cap_notes,
        barrel_condition, barrel_damage, barrel_notes,
        nozzle_caps_present, nozzle_caps_condition, nozzle_caps_notes,
        chain_present, chain_condition, chain_notes,
        repair_needed || false, priority || 'LOW'
      ]);

      // Auto-generate work orders for critical conditions
      if (repair_needed || cap_condition === 'MISSING' ||
        ['POOR'].includes(paint_condition) || ['POOR'].includes(barrel_condition)) {

        await generateWorkOrder(inspectionId, {
          hydrant_id: req.body.hydrant_id,
          title: 'Critical Maintenance Required - Visual Inspection',
          description: `Visual inspection identified critical issues requiring repair`,
          priority: priority || 'HIGH',
          category: 'SAFETY_HAZARD',
          created_by: req.user.id
        });
      }

      res.json({
        success: true,
        message: 'Visual inspection recorded',
        visual_inspection: result.rows[0],
        photos_uploaded: photoUrls.length
      });

    } catch (error) {
      console.error('Error recording visual inspection:', error);
      res.status(500).json({ error: 'Failed to record visual inspection' });
    }
  }
);


// =============================================
// VALVE OPERATION MODULE
// =============================================

// Create/Update valve inspection
router.post('/inspections/:inspectionId/valve',
  authMiddleware,
  orgContext, // From PR #33
  upload.array('valve_photos', 10),
  [
    param('inspectionId').isInt().withMessage('Valid inspection ID required'),
    body('main_valve_operation').isIn(['SMOOTH', 'STIFF', 'BINDING', 'INOPERABLE']),
    body('static_pressure_psi').optional().isFloat({ min: 0, max: 200 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { inspectionId } = req.params;
      const {
        main_valve_type, main_valve_operation, main_valve_turns_to_close,
        main_valve_turns_to_open, main_valve_leak_detected, main_valve_notes,
        operating_nut_condition, operating_nut_security,
        drain_valve_present, drain_valve_operation, drain_valve_leak,
        pumper_connections_count, pumper_connections_condition,
        pumper_caps_present, pumper_caps_condition, pumper_threads_condition,
        static_pressure_psi, static_pressure_location, pressure_gauge_calibrated,
        pressure_test_notes, valve_exercised, valve_exercise_date,
        valve_exercise_successful, lubrication_applied, lubrication_type,
        performance_issues, repair_recommendations, priority_level
      } = req.body;

      const result = await pool.query(`
        INSERT INTO valve_inspections (
          maintenance_inspection_id, main_valve_type, main_valve_operation,
          main_valve_turns_to_close, main_valve_turns_to_open, main_valve_leak_detected,
          main_valve_notes, operating_nut_condition, operating_nut_security,
          drain_valve_present, drain_valve_operation, drain_valve_leak,
          pumper_connections_count, pumper_connections_condition, pumper_caps_present,
          pumper_caps_condition, pumper_threads_condition, static_pressure_psi,
          static_pressure_location, pressure_gauge_calibrated, pressure_test_notes,
          valve_exercised, valve_exercise_date, valve_exercise_successful,
          lubrication_applied, lubrication_type, performance_issues,
          repair_recommendations, priority_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        ON CONFLICT (maintenance_inspection_id)
        DO UPDATE SET
          main_valve_operation = EXCLUDED.main_valve_operation,
          main_valve_turns_to_close = EXCLUDED.main_valve_turns_to_close,
          main_valve_turns_to_open = EXCLUDED.main_valve_turns_to_open,
          main_valve_leak_detected = EXCLUDED.main_valve_leak_detected,
          main_valve_notes = EXCLUDED.main_valve_notes,
          operating_nut_condition = EXCLUDED.operating_nut_condition,
          operating_nut_security = EXCLUDED.operating_nut_security,
          static_pressure_psi = EXCLUDED.static_pressure_psi,
          pressure_test_notes = EXCLUDED.pressure_test_notes,
          valve_exercised = EXCLUDED.valve_exercised,
          valve_exercise_date = EXCLUDED.valve_exercise_date,
          lubrication_applied = EXCLUDED.lubrication_applied,
          repair_recommendations = EXCLUDED.repair_recommendations,
          priority_level = EXCLUDED.priority_level
        RETURNING *
      `, [
        inspectionId, main_valve_type, main_valve_operation,
        main_valve_turns_to_close, main_valve_turns_to_open, main_valve_leak_detected,
        main_valve_notes, operating_nut_condition, operating_nut_security,
        drain_valve_present, drain_valve_operation, drain_valve_leak,
        pumper_connections_count, pumper_connections_condition, pumper_caps_present,
        pumper_caps_condition, pumper_threads_condition, static_pressure_psi,
        static_pressure_location, pressure_gauge_calibrated, pressure_test_notes,
        valve_exercised, valve_exercise_date, valve_exercise_successful,
        lubrication_applied, lubrication_type, performance_issues,
        repair_recommendations, priority_level
      ]);

      // Auto-generate work orders for valve issues
      if (['BINDING', 'INOPERABLE'].includes(main_valve_operation) ||
        priority_level === 'CRITICAL' || main_valve_leak_detected) {

        await generateWorkOrder(inspectionId, {
          hydrant_id: req.body.hydrant_id,
          title: 'Valve Repair Required',
          description: `Valve inspection identified: ${main_valve_operation} operation, ${repair_recommendations}`,
          priority: priority_level || 'HIGH',
          category: 'VALVE_REPAIR',
          created_by: req.user.id
        });
      }

      res.json({
        success: true,
        message: 'Valve inspection recorded',
        valve_inspection: result.rows[0]
      });

    } catch (error) {
      console.error('Error recording valve inspection:', error);
      res.status(500).json({ error: 'Failed to record valve inspection' });
    }
  }
);

// =============================================
// GENERAL MAINTENANCE ENDPOINTS
// =============================================

// Get all inspections for the organization
router.get('/inspections',
  authMiddleware,
  orgContext, // From PR #33
  async (req, res) => {
    try {
      // Enhanced user validation
      if (!req.user || !req.user.id) {
        console.error('Authentication error: User object missing from request');
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Please log in again'
        });
      }

      // Get user and organization with better error handling
      let userResult;
      try {
        userResult = await pool.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [req.user.id]
        );
      } catch (dbError) {
        console.error('Database error fetching user:', dbError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Unable to fetch user data'
        });
      }

      if (!userResult.rows || userResult.rows.length === 0) {
        console.error('User not found in database:', req.user.id);
        return res.status(404).json({
          error: 'User not found',
          message: 'Your user account could not be found. Please contact support.'
        });
      }

      const organizationId = userResult.rows[0].organization_id;

      if (!organizationId) {
        console.error('User has no organization:', req.user.id);
        return res.status(403).json({
          error: 'No organization assigned',
          message: 'Your account is not associated with an organization. Please contact your administrator.'
        });
      }

      const result = await pool.query(`
        SELECT 
          mi.*,
          h.hydrant_number,
          h.address
        FROM maintenance_inspections mi
        JOIN hydrants h ON mi.hydrant_id = h.id
        WHERE h.organization_id = $1
        ORDER BY mi.inspection_date DESC
        LIMIT 50
      `, [organizationId]);


      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all inspections:', error);
      res.status(500).json({
        error: 'Failed to fetch inspections',
        message: 'An error occurred while loading maintenance data. Please try again.'
      });
    }
  }
);

// Create new work order
router.post('/work-orders',
  authMiddleware,
  orgContext,
  upload.array('photos', 5),
  [
    body('hydrant_id').isInt().withMessage('Valid hydrant ID required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    body('target_completion_date').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        hydrant_id, title, description, priority, category,
        assigned_to, department, target_completion_date,
        estimated_cost, materials_required
      } = req.body;

      // Generate work order number
      const workOrderNumber = 'WO-' + Date.now();

      // Prepare description with extra fields
      let fullDescription = description || '';
      if (category) fullDescription += `\n\nCategory: ${category}`;
      if (department) fullDescription += `\nDepartment: ${department}`;
      if (estimated_cost) fullDescription += `\nEstimated Cost: $${estimated_cost}`;
      if (materials_required) {
        try {
          const materials = typeof materials_required === 'string' ? JSON.parse(materials_required) : materials_required;
          if (Array.isArray(materials) && materials.length > 0) {
            fullDescription += `\nMaterials Required: ${materials.join(', ')}`;
          }
        } catch (e) {
          // Ignore parsing error
        }
      }

      const client = await pool.connect();
      try {
        const result = await client.query(`
          INSERT INTO repair_work_orders (
            hydrant_id, work_order_number, title, description,
            priority, status, target_date, created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, 'CREATED', $6, $7, NOW())
          RETURNING *
        `, [
          hydrant_id,
          workOrderNumber,
          title,
          fullDescription,
          priority,
          target_completion_date || null,
          req.user.id
        ]);

        res.status(201).json({
          success: true,
          message: 'Work order created successfully',
          work_order: result.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ error: 'Failed to create work order' });
    }
  }
);


// Get all work orders for the organization  
router.get('/work-orders',
  authMiddleware,
  orgContext, // From PR #33
  async (req, res) => {
    try {
      // Enhanced user validation
      if (!req.user || !req.user.id) {
        console.error('Authentication error: User object missing from request');
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Please log in again'
        });
      }

      // Get user and organization with better error handling
      let userResult;
      try {
        userResult = await pool.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [req.user.id]
        );
      } catch (dbError) {
        console.error('Database error fetching user:', dbError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Unable to fetch user data'
        });
      }

      if (!userResult.rows || userResult.rows.length === 0) {
        console.error('User not found in database:', req.user.id);
        return res.status(404).json({
          error: 'User not found',
          message: 'Your user account could not be found. Please contact support.'
        });
      }

      const organizationId = userResult.rows[0].organization_id;

      if (!organizationId) {
        console.error('User has no organization:', req.user.id);
        return res.status(403).json({
          error: 'No organization assigned',
          message: 'Your account is not associated with an organization. Please contact your administrator.'
        });
      }

      const result = await pool.query(`
        SELECT 
          rwo.*,
          h.hydrant_number,
          h.address,
          CASE 
            WHEN rwo.status = 'COMPLETED' THEN 100
            WHEN rwo.status = 'IN_PROGRESS' THEN 50
            WHEN rwo.status = 'PENDING' THEN 25
            ELSE 0
          END as progress
        FROM repair_work_orders rwo
        JOIN hydrants h ON rwo.hydrant_id = h.id
        WHERE h.organization_id = $1
        ORDER BY 
          CASE rwo.priority 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END,
          rwo.created_at DESC
        LIMIT 50
      `, [organizationId]);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all work orders:', error);
      res.status(500).json({
        error: 'Failed to fetch work orders',
        message: 'An error occurred while loading work order data. Please try again.'
      });
    }
  }
);



// Get maintenance statistics for the organization
router.get('/stats',
  authMiddleware,
  orgContext, // From PR #33
  async (req, res) => {
    try {
      // Enhanced user validation
      if (!req.user || !req.user.id) {
        console.error('Authentication error: User object missing from request');
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Please log in again'
        });
      }

      // Get user and organization with better error handling
      let userResult;
      try {
        userResult = await pool.query(
          'SELECT organization_id FROM users WHERE id = $1',
          [req.user.id]
        );
      } catch (dbError) {
        console.error('Database error fetching user:', dbError);
        return res.status(500).json({
          error: 'Database error',
          message: 'Unable to fetch user data'
        });
      }

      if (!userResult.rows || userResult.rows.length === 0) {
        console.error('User not found in database:', req.user.id);
        return res.status(404).json({
          error: 'User not found',
          message: 'Your user account could not be found. Please contact support.'
        });
      }

      const organizationId = userResult.rows[0].organization_id;

      if (!organizationId) {
        console.error('User has no organization:', req.user.id);
        return res.status(403).json({
          error: 'No organization assigned',
          message: 'Your account is not associated with an organization. Please contact your administrator.'
        });
      }

      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN rwo.status = 'PENDING' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN rwo.status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN rwo.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM repair_work_orders rwo
        JOIN hydrants h ON rwo.hydrant_id = h.id
        WHERE h.organization_id = $1
      `, [organizationId]);

      res.json(statsResult.rows[0] || { total: 0, scheduled: 0, in_progress: 0, completed: 0 });
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        message: 'An error occurred while loading statistics. Please try again.'
      });
    }
  }
);


// =============================================
// WORK ORDER MANAGEMENT
// =============================================

// Get work orders for a hydrant
router.get('/work-orders/hydrant/:hydrantId',
  authMiddleware,
  orgContext, // From PR #33
  param('hydrantId').notEmpty(),
  async (req, res) => {
    try {
      const { hydrantId } = req.params;
      const { status = 'all', priority = 'all', limit = 20, offset = 0 } = req.query;

      let whereClause = 'WHERE hydrant_id = $1';
      let params = [hydrantId];

      if (status !== 'all') {
        whereClause += ' AND status = $' + (params.length + 1);
        params.push(status);
      }

      if (priority !== 'all') {
        whereClause += ' AND priority = $' + (params.length + 1);
        params.push(priority);
      }

      const result = await pool.query(`
        SELECT 
          rwo.*,
          mi.inspection_date,
          mi.inspector_name,
          mi.inspection_type
        FROM repair_work_orders rwo
        LEFT JOIN maintenance_inspections mi ON rwo.maintenance_inspection_id = mi.id
        ${whereClause}
        ORDER BY 
          CASE rwo.priority 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END,
          rwo.scheduled_date ASC NULLS LAST,
          rwo.created_at ASC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      res.json({
        success: true,
        work_orders: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Error fetching work orders:', error);
      res.status(500).json({ error: 'Failed to fetch work orders' });
    }
  }
);


// Update work order status
// Update work order status
router.patch('/work-orders/:workOrderId',
  authMiddleware,
  orgContext, // From PR #33
  upload.array('completion_photos', 10),
  [
    param('workOrderId').isInt(),
    body('status').optional().isIn(['CREATED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'DEFERRED'])
  ],
  async (req, res) => {
    try {
      const { workOrderId } = req.params;
      const {
        status, completion_notes, actual_cost, labor_hours,
        materials_used, inspector_approval
      } = req.body;

      const completionPhotos = req.files ? req.files.map(file => `/uploads/maintenance/${file.filename}`) : [];

      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (status) {
        updateFields.push(`status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }

      if (status === 'COMPLETED') {
        updateFields.push(`actual_completion_date = CURRENT_TIMESTAMP`);
        updateFields.push(`approval_date = CURRENT_TIMESTAMP`);
      }

      if (completion_notes) {
        updateFields.push(`completion_notes = $${paramCount}`);
        params.push(completion_notes);
        paramCount++;
      }

      if (actual_cost) {
        updateFields.push(`actual_cost = $${paramCount}`);
        params.push(actual_cost);
        paramCount++;
      }

      if (labor_hours) {
        updateFields.push(`labor_hours = $${paramCount}`);
        params.push(labor_hours);
        paramCount++;
      }

      if (materials_used) {
        updateFields.push(`materials_used = $${paramCount}`);
        params.push(JSON.stringify(materials_used));
        paramCount++;
      }

      if (completionPhotos.length > 0) {
        updateFields.push(`completion_photos = $${paramCount}`);
        params.push(JSON.stringify(completionPhotos));
        paramCount++;
      }

      updateFields.push(`updated_by = $${paramCount}`);
      params.push(req.user.id);
      paramCount++;

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(workOrderId);

      const result = await pool.query(`
        UPDATE repair_work_orders 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Work order not found' });
      }

      res.json({
        success: true,
        message: 'Work order updated successfully',
        work_order: result.rows[0]
      });

    } catch (error) {
      console.error('Error updating work order:', error);
      res.status(500).json({ error: 'Failed to update work order' });
    }
  }
);

// Helper function to generate work order
async function generateWorkOrder(inspectionId, data) {
  const client = await pool.connect();
  try {
    // Generate a simple work order number if one isn't provided
    const workOrderNumber = 'WO-' + Date.now();

    await client.query(`
      INSERT INTO repair_work_orders (
        maintenance_inspection_id, hydrant_id, title, description,
        priority, status, created_by, created_at, work_order_number
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, NOW(), $7)
    `, [
      inspectionId,
      data.hydrant_id,
      data.title,
      data.description,
      data.priority,
      data.created_by,
      workOrderNumber
    ]);
  } catch (err) {
    console.error('Error generating work order:', err);
  } finally {
    client.release();
  }
}

module.exports = router;
