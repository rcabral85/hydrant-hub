const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// ============================================
// DASHBOARD STATISTICS
// ============================================

// Get comprehensive dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Get hydrant statistics
    const hydrantStats = await db.query(`
      SELECT 
        COUNT(*) as total_hydrants,
        COUNT(*) FILTER (WHERE status = 'active') as active_hydrants,
        COUNT(*) FILTER (WHERE status = 'out_of_service') as out_of_service,
        COUNT(*) FILTER (WHERE last_inspection_date IS NULL) as never_inspected,
        COUNT(*) FILTER (
          WHERE last_inspection_date < CURRENT_DATE - INTERVAL '1 year'
        ) as inspection_overdue,
        COUNT(*) FILTER (
          WHERE last_flow_test_date IS NULL
        ) as never_tested,
        COUNT(*) FILTER (
          WHERE last_flow_test_date < CURRENT_DATE - INTERVAL '1 year'
        ) as test_overdue
      FROM hydrants
      WHERE organization_id = $1
    `, [organizationId]);

    // Get NFPA class distribution
    const nfpaStats = await db.query(`
      SELECT 
        nfpa_class,
        COUNT(*) as count
      FROM hydrants
      WHERE organization_id = $1 AND nfpa_class IS NOT NULL
      GROUP BY nfpa_class
      ORDER BY nfpa_class
    `, [organizationId]);

    // Get maintenance statistics
    const maintenanceStats = await db.query(`
      SELECT 
        COUNT(*) as total_maintenance,
        COUNT(*) FILTER (WHERE m.status = 'scheduled') as scheduled,
        COUNT(*) FILTER (WHERE m.status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE m.status = 'completed') as completed,
        COUNT(*) FILTER (WHERE maintenance_type = 'inspection') as inspections,
        COUNT(*) FILTER (WHERE maintenance_type IN ('repair', 'painting', 'lubrication', 'winterization', 'other')) as work_orders
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      WHERE h.organization_id = $1
    `, [organizationId]);

    // Get flow test statistics
    const flowTestStats = await db.query(`
      SELECT 
        COUNT(*) as total_flow_tests,
        COUNT(*) FILTER (WHERE test_date >= CURRENT_DATE - INTERVAL '30 days') as tests_last_30_days,
        COUNT(*) FILTER (WHERE test_date >= CURRENT_DATE - INTERVAL '1 year') as tests_last_year,
        AVG(available_flow_gpm)::INTEGER as avg_flow_gpm
      FROM flow_tests
      WHERE organization_id = $1
    `, [organizationId]);

    const totalHydrants = parseInt(hydrantStats.rows[0].total_hydrants) || 0;
    const inspectionOverdue = parseInt(hydrantStats.rows[0].inspection_overdue) || 0;
    const neverInspected = parseInt(hydrantStats.rows[0].never_inspected) || 0;
    const nonCompliant = inspectionOverdue + neverInspected;
    const compliancePercentage = totalHydrants > 0
      ? Math.round(((totalHydrants - nonCompliant) / totalHydrants) * 100)
      : 100;

    // Build response
    const stats = {
      hydrants: {
        total: totalHydrants,
        active: parseInt(hydrantStats.rows[0].active_hydrants) || 0,
        outOfService: parseInt(hydrantStats.rows[0].out_of_service) || 0,
        neverInspected: neverInspected,
        inspectionOverdue: inspectionOverdue,
        neverTested: parseInt(hydrantStats.rows[0].never_tested) || 0,
        testOverdue: parseInt(hydrantStats.rows[0].test_overdue) || 0,
      },
      nfpaClasses: nfpaStats.rows.reduce((acc, row) => {
        acc[row.nfpa_class] = parseInt(row.count);
        return acc;
      }, { 'AA': 0, 'A': 0, 'B': 0, 'C': 0 }),
      maintenance: {
        total: parseInt(maintenanceStats.rows[0].total_maintenance) || 0,
        scheduled: parseInt(maintenanceStats.rows[0].scheduled) || 0,
        inProgress: parseInt(maintenanceStats.rows[0].in_progress) || 0,
        completed: parseInt(maintenanceStats.rows[0].completed) || 0,
        inspections: parseInt(maintenanceStats.rows[0].inspections) || 0,
        workOrders: parseInt(maintenanceStats.rows[0].work_orders) || 0,
      },
      flowTests: {
        total: parseInt(flowTestStats.rows[0].total_flow_tests) || 0,
        last30Days: parseInt(flowTestStats.rows[0].tests_last_30_days) || 0,
        lastYear: parseInt(flowTestStats.rows[0].tests_last_year) || 0,
        avgFlowGpm: parseInt(flowTestStats.rows[0].avg_flow_gpm) || 0,
      },
      compliance: {
        percentage: compliancePercentage,
        compliant: totalHydrants - nonCompliant,
        nonCompliant: nonCompliant,
      },
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity feed
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 20;

    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Get recent activities (maintenance, flow tests, etc.)
    const activities = await db.query(`
      SELECT 
        'maintenance' as type,
      m.id,
      m.maintenance_type as subtype,
      m.title,
      m.status,
      h.hydrant_id,
      h.address as location,
      u.first_name || ' ' || u.last_name as performed_by,
      COALESCE(m.completed_date, m.scheduled_date) as activity_date,
      m.created_at
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      LEFT JOIN users u ON m.assigned_to = u.id
      WHERE h.organization_id = $1

      UNION ALL

      SELECT 
        'flow_test' as type,
      ft.id,
      'flow_test' as subtype,
      'Flow Test - ' || ft.test_number as title,
      CASE WHEN ft.is_nfpa_compliant THEN 'compliant' ELSE 'non_compliant' END as status,
      h.hydrant_id,
      h.address as location,
      u.first_name || ' ' || u.last_name as performed_by,
      ft.test_date as activity_date,
      ft.created_at
      FROM flow_tests ft
      JOIN hydrants h ON ft.hydrant_id = h.id
      LEFT JOIN users u ON ft.tester_id = u.id
      WHERE ft.organization_id = $1

      ORDER BY activity_date DESC NULLS LAST, created_at DESC
      LIMIT $2
      `, [organizationId, limit]);

    res.json(activities.rows);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// Get upcoming maintenance schedule
router.get('/upcoming-maintenance', async (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;

    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Get upcoming scheduled maintenance
    const upcoming = await db.query(`
      SELECT 
        m.id,
      m.work_order_number,
      m.maintenance_type,
      m.title,
      m.priority,
      m.status,
      m.scheduled_date,
      h.hydrant_id,
      h.address as location,
      u.first_name || ' ' || u.last_name as assigned_to_name
      FROM maintenance m
      JOIN hydrants h ON m.hydrant_id = h.id
      LEFT JOIN users u ON m.assigned_to = u.id
      WHERE h.organization_id = $1
        AND m.status IN('scheduled', 'in_progress')
        AND m.scheduled_date >= CURRENT_DATE
        AND m.scheduled_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
      ORDER BY m.scheduled_date ASC, m.priority DESC
      `, [organizationId, days]);

    res.json(upcoming.rows);

  } catch (error) {
    console.error('Error fetching upcoming maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming maintenance' });
  }
});

// Get compliance overview
router.get('/compliance', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's organization
    const userQuery = await db.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (!userQuery.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const organizationId = userQuery.rows[0].organization_id;

    // Get compliance data using the view
    const compliance = await db.query(`
      SELECT 
        inspection_status,
      flow_test_status,
      COUNT(*) as count
      FROM hydrant_compliance
      WHERE organization_id = $1
      GROUP BY inspection_status, flow_test_status
      `, [organizationId]);

    // Get hydrants needing attention
    const needsAttention = await db.query(`
      SELECT 
        h.id,
      h.hydrant_id,
      h.address,
      h.last_inspection_date,
      h.last_flow_test_date,
      hc.inspection_status,
      hc.flow_test_status
      FROM hydrant_compliance hc
      JOIN hydrants h ON hc.id = h.id
      WHERE hc.organization_id = $1
        AND(hc.inspection_status IN('overdue', 'never_inspected')
         OR hc.flow_test_status IN('overdue', 'never_tested'))
      ORDER BY 
        CASE 
          WHEN hc.inspection_status = 'never_inspected' THEN 1
          WHEN hc.inspection_status = 'overdue' THEN 2
          ELSE 3
        END,
      h.last_inspection_date NULLS FIRST
      LIMIT 20
      `, [organizationId]);

    res.json({
      summary: compliance.rows,
      needsAttention: needsAttention.rows,
    });

  } catch (error) {
    console.error('Error fetching compliance data:', error);
    res.status(500).json({ error: 'Failed to fetch compliance data' });
  }
});

module.exports = router;