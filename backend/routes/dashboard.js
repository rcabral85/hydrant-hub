
/**
 * Dashboard Metrics Routes
 * Provides real-time metrics from database (no hardcoded data)
 */

const express = require('express');
const router = express.Router();
const { operatorOrAdmin } = require('../middleware/roleCheck');
const { db } = require('../config/database');

/**
 * GET /api/dashboard/metrics
 * Get comprehensive dashboard metrics for the organization
 */
router.get('/metrics', operatorOrAdmin, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    // Get hydrant statistics
    const hydrantStats = await db.query(
      `SELECT 
        COUNT(*) as total_hydrants,
        COUNT(*) FILTER (WHERE status = 'active') as active_hydrants,
        COUNT(*) FILTER (WHERE status = 'out_of_service') as out_of_service_hydrants,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_hydrants,
        COUNT(*) FILTER (WHERE next_test_due < CURRENT_DATE) as overdue_tests
      FROM hydrants
      WHERE organization_id = $1`,
      [organizationId],
    );

    // Get NFPA class distribution
    const nfpaDistribution = await db.query(
      `SELECT 
        nfpa_class,
        COUNT(*) as count
      FROM hydrants
      WHERE organization_id = $1 AND nfpa_class IS NOT NULL
      GROUP BY nfpa_class
      ORDER BY nfpa_class`,
      [organizationId],
    );

    // Get recent activity (last 30 days)
    const recentActivity = await db.query(
      `SELECT 
        COUNT(DISTINCT ft.id) as flow_tests_30d,
        COUNT(DISTINCT i.id) as inspections_30d
      FROM hydrants h
      LEFT JOIN flow_tests ft ON h.id = ft.hydrant_id 
        AND ft.test_date >= CURRENT_DATE - INTERVAL '30 days'
      LEFT JOIN inspections i ON h.id = i.hydrant_id 
        AND i.inspection_date >= CURRENT_DATE - INTERVAL '30 days'
      WHERE h.organization_id = $1`,
      [organizationId],
    );

    // Get total counts
    const totalCounts = await db.query(
      `SELECT 
        COUNT(DISTINCT ft.id) as total_flow_tests,
        COUNT(DISTINCT i.id) as total_inspections
      FROM hydrants h
      LEFT JOIN flow_tests ft ON h.id = ft.hydrant_id
      LEFT JOIN inspections i ON h.id = i.hydrant_id
      WHERE h.organization_id = $1`,
      [organizationId],
    );

    // Calculate compliance percentage
    const totalHydrants = parseInt(hydrantStats.rows[0].total_hydrants);
    const overdueTests = parseInt(hydrantStats.rows[0].overdue_tests);
    const compliancePercentage = totalHydrants > 0
      ? Math.round(((totalHydrants - overdueTests) / totalHydrants) * 100)
      : 100;

    // Build response
    const metrics = {
      hydrants: {
        total: parseInt(hydrantStats.rows[0].total_hydrants),
        active: parseInt(hydrantStats.rows[0].active_hydrants),
        outOfService: parseInt(hydrantStats.rows[0].out_of_service_hydrants),
        inactive: parseInt(hydrantStats.rows[0].inactive_hydrants),
        overdueTests: overdueTests,
      },
      nfpaClassification: nfpaDistribution.rows.reduce((acc, row) => {
        acc[row.nfpa_class] = parseInt(row.count);
        return acc;
      }, {}),
      activity: {
        recentFlowTests: parseInt(recentActivity.rows[0].flow_tests_30d),
        recentInspections: parseInt(recentActivity.rows[0].inspections_30d),
        totalFlowTests: parseInt(totalCounts.rows[0].total_flow_tests),
        totalInspections: parseInt(totalCounts.rows[0].total_inspections),
      },
      compliance: {
        percentage: compliancePercentage,
        upToDate: totalHydrants - overdueTests,
        overdue: overdueTests,
      },
    };

    res.json(metrics);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
