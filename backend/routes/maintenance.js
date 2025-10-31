// HydrantHub Maintenance & Inspection API Routes
// Comprehensive maintenance system with audit compliance
// Supports O. Reg 169/03, NFPA 291, and AWWA M17 standards

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { body, validationResult, param, query } = require('express-validator');
const authMiddleware = require('../middleware/auth');
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

// Create new maintenance inspection
router.post('/inspections', 
  authMiddleware,
  upload.array('photos', 10),
  [
    body('hydrant_id').notEmpty().withMessage('Hydrant ID is required'),
    body('inspection_type_id').isInt().withMessage('Valid inspection type required'),
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
          inspection_type_id,
          inspector_name,
          inspector_license,
          inspection_date,
          scheduled_date,
          overall_status,
          overall_notes,
          compliance_status
        } = req.body;

        // Process uploaded photos
        const photoUrls = req.files ? req.files.map(file => `/uploads/maintenance/${file.filename}`) : [];

        // Create main inspection record
        const inspectionResult = await client.query(`
          INSERT INTO maintenance_inspections (
            hydrant_id, inspection_type_id, inspector_name, inspector_license,
            inspection_date, scheduled_date, overall_status, overall_notes,
            compliance_status, photos, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
          RETURNING *
        `, [
          hydrant_id, inspection_type_id, inspector_name, inspector_license,
          inspection_date, scheduled_date, overall_status, overall_notes,
          compliance_status, JSON.stringify(photoUrls), req.user.id
        ]);

        const inspection = inspectionResult.rows[0];

        // Create maintenance history entry
        await client.query(`
          INSERT INTO maintenance_history (
            hydrant_id, action_type, action_description, action_date,
            performed_by, license_number, department, notes, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          hydrant_id,
          'INSPECTION',
          `${inspection_types[inspection_type_id]} completed`,
          inspection_date,
          inspector_name,
          inspector_license,
          req.user.department || 'Water Operations',
          overall_notes,
          req.user.id
        ]);

        await client.query('COMMIT');
        
        res.status(201).json({
          success: true,
          message: 'Inspection created successfully',
          inspection: inspection
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Error creating inspection:', error);
      res.status(500).json({ error: 'Failed to create inspection' });
    }
  }
);

// Get maintenance inspections for a hydrant
router.get('/inspections/hydrant/:hydrantId',
  authMiddleware,
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
          it.name as inspection_type,
          it.description as inspection_description,
          it.regulatory_requirement,
          
          -- Visual Inspection Data
          vi.paint_condition,
          vi.body_condition,
          vi.cap_condition,
          vi.chains_condition,
          vi.clearance_adequate,
          vi.safety_hazards,
          
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
        JOIN inspection_types it ON mi.inspection_type_id = it.id
        LEFT JOIN visual_inspections vi ON mi.id = vi.maintenance_inspection_id
        LEFT JOIN valve_inspections vale ON mi.id = vale.maintenance_inspection_id
        LEFT JOIN repair_work_orders rwo ON mi.id = rwo.maintenance_inspection_id
        ${whereClause}
        GROUP BY mi.id, it.name, it.description, it.regulatory_requirement, 
                 vi.paint_condition, vi.body_condition, vi.cap_condition, vi.chains_condition,
                 vi.clearance_adequate, vi.safety_hazards, vale.main_valve_operation,
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
  upload.array('condition_photos', 15),
  [
    param('inspectionId').isUUID().withMessage('Valid inspection ID required'),
    body('paint_condition').isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']),
    body('body_condition').isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']),
    body('cap_condition').isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'MISSING'])
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
        paint_condition, paint_notes, body_condition, body_damage_notes,
        cap_condition, cap_security, chains_present, chains_condition,
        clearance_adequate, clearance_distance_feet, obstructions,
        visible_from_road, reflective_markers_present, signage_adequate,
        ground_condition, drainage_adequate, safety_hazards, immediate_action_required
      } = req.body;

      const result = await pool.query(`
        INSERT INTO visual_inspections (
          maintenance_inspection_id, paint_condition, paint_notes, body_condition,
          body_damage_notes, cap_condition, cap_security, chains_present,
          chains_condition, clearance_adequate, clearance_distance_feet,
          obstructions, visible_from_road, reflective_markers_present,
          signage_adequate, ground_condition, drainage_adequate,
          safety_hazards, immediate_action_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (maintenance_inspection_id) 
        DO UPDATE SET
          paint_condition = EXCLUDED.paint_condition,
          paint_notes = EXCLUDED.paint_notes,
          body_condition = EXCLUDED.body_condition,
          body_damage_notes = EXCLUDED.body_damage_notes,
          cap_condition = EXCLUDED.cap_condition,
          cap_security = EXCLUDED.cap_security,
          chains_present = EXCLUDED.chains_present,
          chains_condition = EXCLUDED.chains_condition,
          clearance_adequate = EXCLUDED.clearance_adequate,
          clearance_distance_feet = EXCLUDED.clearance_distance_feet,
          obstructions = EXCLUDED.obstructions,
          visible_from_road = EXCLUDED.visible_from_road,
          reflective_markers_present = EXCLUDED.reflective_markers_present,
          signage_adequate = EXCLUDED.signage_adequate,
          ground_condition = EXCLUDED.ground_condition,
          drainage_adequate = EXCLUDED.drainage_adequate,
          safety_hazards = EXCLUDED.safety_hazards,
          immediate_action_required = EXCLUDED.immediate_action_required
        RETURNING *
      `, [
        inspectionId, paint_condition, paint_notes, body_condition,
        body_damage_notes, cap_condition, cap_security, chains_present,
        chains_condition, clearance_adequate, clearance_distance_feet,
        obstructions, visible_from_road, reflective_markers_present,
        signage_adequate, ground_condition, drainage_adequate,
        safety_hazards, immediate_action_required
      ]);

      // Auto-generate work orders for critical conditions
      if (immediate_action_required || ['CRITICAL', 'POOR'].includes(paint_condition) || 
          ['CRITICAL', 'POOR'].includes(body_condition) || cap_condition === 'MISSING') {
        
        await generateWorkOrder(inspectionId, {
          hydrant_id: req.body.hydrant_id,
          title: 'Critical Maintenance Required - Visual Inspection',
          description: `Visual inspection identified critical issues: ${safety_hazards || 'Multiple condition issues'}`,
          priority: immediate_action_required ? 'CRITICAL' : 'HIGH',
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
  upload.array('valve_photos', 10),
  [
    param('inspectionId').isUUID().withMessage('Valid inspection ID required'),
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
// WORK ORDER MANAGEMENT
// =============================================

// Get work orders for a hydrant
router.get('/work-orders/hydrant/:hydrantId',
  authMiddleware,
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
          it.name as inspection_type,
          
          -- Progress Tracking
          CASE 
            WHEN rwo.status = 'COMPLETED' THEN 100
            WHEN rwo.status = 'IN_PROGRESS' THEN 50
            WHEN rwo.status = 'SCHEDULED' THEN 25
            ELSE 0
          END as progress_percentage,
          
          -- Overdue Status
          CASE 
            WHEN rwo.target_completion_date < CURRENT_DATE AND rwo.status NOT IN ('COMPLETED', 'CANCELLED') 
            THEN true 
            ELSE false 
          END as is_overdue
          
        FROM repair_work_orders rwo
        LEFT JOIN maintenance_inspections mi ON rwo.maintenance_inspection_id = mi.id
        LEFT JOIN inspection_types it ON mi.inspection_type_id = it.id
        ${whereClause}
        ORDER BY 
          CASE rwo.priority 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END,
          rwo.scheduled_date ASC NULLS LAST,
          rwo.created_date ASC
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
router.patch('/work-orders/:workOrderId',
  authMiddleware,
  upload.array('completion_photos', 10),
  [
    param('workOrderId').isUUID(),
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

// =============================================
// COMPLIANCE & SCHEDULING
// =============================================

// Get compliance schedule for municipality/organization
router.get('/compliance/schedule',
  authMiddleware,
  [
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('status').optional().isIn(['SCHEDULED', 'OVERDUE', 'COMPLETED', 'DEFERRED'])
  ],
  async (req, res) => {
    try {
      const { start_date, end_date, status = 'all', hydrant_id } = req.query;
      
      let whereConditions = [];
      let params = [];
      let paramCount = 1;

      if (start_date) {
        whereConditions.push(`cs.due_date >= $${paramCount}`);
        params.push(start_date);
        paramCount++;
      }
      
      if (end_date) {
        whereConditions.push(`cs.due_date <= $${paramCount}`);
        params.push(end_date);
        paramCount++;
      }
      
      if (status !== 'all') {
        whereConditions.push(`cs.status = $${paramCount}`);
        params.push(status);
        paramCount++;
      }
      
      if (hydrant_id) {
        whereConditions.push(`cs.hydrant_id = $${paramCount}`);
        params.push(hydrant_id);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      const result = await pool.query(`
        SELECT 
          cs.*,
          h.hydrant_number,
          h.location_address,
          h.latitude,
          h.longitude,
          it.name as inspection_type,
          it.description as inspection_description,
          it.regulatory_requirement,
          
          -- Days until due/overdue
          cs.due_date - CURRENT_DATE as days_until_due,
          
          -- Last inspection info
          mi.inspection_date as last_inspection_date,
          mi.overall_status as last_inspection_status,
          mi.inspector_name as last_inspector
          
        FROM compliance_schedule cs
        JOIN hydrants h ON cs.hydrant_id = h.id
        JOIN inspection_types it ON cs.inspection_type_id = it.id
        LEFT JOIN maintenance_inspections mi ON cs.completed_inspection_id = mi.id
        ${whereClause}
        ORDER BY 
          CASE cs.status
            WHEN 'OVERDUE' THEN 1
            WHEN 'SCHEDULED' THEN 2
            ELSE 3
          END,
          cs.due_date ASC
      `, params);

      res.json({
        success: true,
        schedule: result.rows,
        total: result.rows.length
      });

    } catch (error) {
      console.error('Error fetching compliance schedule:', error);
      res.status(500).json({ error: 'Failed to fetch compliance schedule' });
    }
  }
);

// Generate compliance report (for audits)
router.get('/compliance/report',
  authMiddleware,
  [
    query('start_date').isISO8601().withMessage('Start date required'),
    query('end_date').isISO8601().withMessage('End date required'),
    query('format').optional().isIn(['json', 'pdf'])
  ],
  async (req, res) => {
    try {
      const { start_date, end_date, format = 'json' } = req.query;

      // Get compliance statistics
      const complianceStats = await pool.query(`
        SELECT * FROM audit_compliance_report
        WHERE inspection_year >= EXTRACT(YEAR FROM $1::date)
          AND inspection_year <= EXTRACT(YEAR FROM $2::date)
        ORDER BY inspection_year DESC, inspection_month DESC
      `, [start_date, end_date]);

      // Get overdue inspections
      const overdueInspections = await pool.query(`
        SELECT 
          h.hydrant_number,
          h.location_address,
          it.name as inspection_type,
          cs.due_date,
          CURRENT_DATE - cs.due_date as days_overdue,
          cs.overdue_notification_sent
        FROM compliance_schedule cs
        JOIN hydrants h ON cs.hydrant_id = h.id
        JOIN inspection_types it ON cs.inspection_type_id = it.id
        WHERE cs.status = 'OVERDUE'
          AND cs.due_date BETWEEN $1 AND $2
        ORDER BY days_overdue DESC
      `, [start_date, end_date]);

      // Get maintenance summary
      const maintenanceSummary = await pool.query(`
        SELECT 
          action_type,
          COUNT(*) as total_actions,
          SUM(cost) as total_cost,
          AVG(labor_hours) as avg_labor_hours
        FROM maintenance_history
        WHERE action_date BETWEEN $1 AND $2
        GROUP BY action_type
        ORDER BY total_actions DESC
      `, [start_date, end_date]);

      const report = {
        report_period: { start_date, end_date },
        generated_at: new Date().toISOString(),
        generated_by: req.user.username,
        
        compliance_statistics: complianceStats.rows,
        overdue_inspections: overdueInspections.rows,
        maintenance_summary: maintenanceSummary.rows,
        
        summary: {
          total_inspections: complianceStats.rows.reduce((sum, row) => sum + row.total_inspections, 0),
          compliance_rate: complianceStats.rows.length > 0 
            ? (complianceStats.rows.reduce((sum, row) => sum + row.compliant_inspections, 0) / 
               complianceStats.rows.reduce((sum, row) => sum + row.total_inspections, 0) * 100).toFixed(2) + '%'
            : '0%',
          overdue_count: overdueInspections.rows.length,
          total_maintenance_cost: maintenanceSummary.rows.reduce((sum, row) => sum + (row.total_cost || 0), 0)
        }
      };

      if (format === 'pdf') {
        // TODO: Generate PDF report using puppeteer or similar
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=compliance-report-${start_date}-to-${end_date}.pdf`);
        // For now, return JSON - PDF generation would be implemented here
      }

      res.json({
        success: true,
        report: report
      });

    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }
);

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Auto-generate work order from inspection
async function generateWorkOrder(inspectionId, workOrderData) {
  const workOrderNumber = 'WO-' + new Date().getFullYear() + '-' + 
                         String(Date.now()).slice(-6);
  
  await pool.query(`
    INSERT INTO repair_work_orders (
      hydrant_id, maintenance_inspection_id, work_order_number,
      title, description, priority, category, created_by,
      target_completion_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE + INTERVAL '30 days')
  `, [
    workOrderData.hydrant_id,
    inspectionId,
    workOrderNumber,
    workOrderData.title,
    workOrderData.description,
    workOrderData.priority,
    workOrderData.category,
    workOrderData.created_by
  ]);
}

// Get inspection checklist template
router.get('/checklist/:inspectionTypeId',
  authMiddleware,
  param('inspectionTypeId').isInt(),
  async (req, res) => {
    try {
      const { inspectionTypeId } = req.params;

      const result = await pool.query(`
        SELECT 
          ict.*,
          it.name as inspection_type_name
        FROM inspection_checklist_templates ict
        JOIN inspection_types it ON ict.inspection_type_id = it.id
        WHERE ict.inspection_type_id = $1 AND ict.active = true
        ORDER BY ict.sort_order, ict.category, ict.id
      `, [inspectionTypeId]);

      const checklist = result.rows.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});

      res.json({
        success: true,
        inspection_type: result.rows[0]?.inspection_type_name,
        checklist: checklist
      });

    } catch (error) {
      console.error('Error fetching inspection checklist:', error);
      res.status(500).json({ error: 'Failed to fetch inspection checklist' });
    }
  }
);

module.exports = router;