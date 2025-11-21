const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const orgContext = require('../middleware/orgContext');

// Apply authentication and organization context to all routes
router.use(authenticateToken);
router.use(orgContext);

/**
 * @route GET /api/reports/generate
 * @desc Generate report data based on type and date range
 * @access Private
 */
router.get('/generate', async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;
        const organizationId = req.organizationId;

        if (!type) {
            return res.status(400).json({ error: 'Report type is required' });
        }

        let reportData = {};

        // Common date filter for queries
        const dateFilter = startDate && endDate
            ? `AND created_at BETWEEN $2 AND $3`
            : '';

        const queryParams = [organizationId];
        if (startDate && endDate) {
            queryParams.push(startDate, endDate);
        }

        switch (type) {
            case 'compliance':
                reportData = await generateComplianceReport(organizationId, startDate, endDate);
                break;
            case 'maintenance':
                reportData = await generateMaintenanceReport(organizationId, startDate, endDate);
                break;
            case 'performance':
                reportData = await generatePerformanceReport(organizationId, startDate, endDate);
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }

        res.json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Helper functions for report generation

async function generateComplianceReport(orgId, startDate, endDate) {
    // 1. Total Hydrants
    const totalHydrantsResult = await db.query(
        'SELECT COUNT(*) FROM hydrants WHERE organization_id = $1',
        [orgId]
    );
    const totalHydrants = parseInt(totalHydrantsResult.rows[0].count);

    // 2. Inspections Completed (in date range)
    // Assuming 'maintenance' table has 'type' = 'inspection'
    const inspectionsQuery = `
    SELECT COUNT(*) FROM maintenance 
    WHERE organization_id = $1 
    AND type = 'inspection'
    ${startDate && endDate ? 'AND created_at BETWEEN $2 AND $3' : ''}
  `;
    const inspectionsParams = [orgId];
    if (startDate && endDate) inspectionsParams.push(startDate, endDate);

    const inspectionsResult = await db.query(inspectionsQuery, inspectionsParams);
    const inspectionsCompleted = parseInt(inspectionsResult.rows[0].count);

    // 3. Flow Tests Completed (NFPA 291)
    const flowTestsQuery = `
    SELECT COUNT(*) FROM flow_tests 
    WHERE organization_id = $1 
    ${startDate && endDate ? 'AND test_date BETWEEN $2 AND $3' : ''}
  `;
    const flowTestsParams = [orgId];
    if (startDate && endDate) flowTestsParams.push(startDate, endDate);

    const flowTestsResult = await db.query(flowTestsQuery, flowTestsParams);
    const flowTestsCompleted = parseInt(flowTestsResult.rows[0].count);

    // 4. Calculate Compliance Rate (simplified logic)
    // Assuming 1 inspection per hydrant required
    const complianceRate = totalHydrants > 0
        ? Math.min(100, (inspectionsCompleted / totalHydrants) * 100).toFixed(1)
        : 0;

    return {
        title: 'Municipal Compliance Report',
        description: 'O. Reg 169/03 and NFPA 291 compliance status',
        stats: {
            total_hydrants: totalHydrants,
            inspections_completed: inspectionsCompleted,
            compliance_rate: complianceRate,
            overdue_count: Math.max(0, totalHydrants - inspectionsCompleted), // Simplified
            work_orders_completed: 0, // Placeholder
            total_maintenance_cost: 0 // Placeholder
        },
        breakdown: [
            {
                category: 'Annual Inspections',
                completed: inspectionsCompleted,
                required: totalHydrants,
                percentage: complianceRate
            },
            {
                category: 'Flow Tests (NFPA 291)',
                completed: flowTestsCompleted,
                required: totalHydrants,
                percentage: totalHydrants > 0 ? Math.min(100, (flowTestsCompleted / totalHydrants) * 100).toFixed(1) : 0
            }
        ]
    };
}

async function generateMaintenanceReport(orgId, startDate, endDate) {
    // Placeholder for maintenance report logic
    // You would query the 'maintenance' table for work orders, costs, etc.

    const workOrdersQuery = `
    SELECT COUNT(*) FROM maintenance 
    WHERE organization_id = $1 
    AND type = 'repair'
    ${startDate && endDate ? 'AND created_at BETWEEN $2 AND $3' : ''}
  `;
    const params = [orgId];
    if (startDate && endDate) params.push(startDate, endDate);

    const result = await db.query(workOrdersQuery, params);
    const workOrdersCount = parseInt(result.rows[0].count);

    return {
        title: 'Maintenance Summary Report',
        description: 'Preventive maintenance activities and cost analysis',
        stats: {
            inspections_ytd: 0, // Implement real query
            work_orders_created: workOrdersCount,
            work_orders_completed: 0, // Implement real query
            avg_completion_time: 0,
            total_labor_hours: 0,
            total_cost: 0
        },
        categories: []
    };
}

async function generatePerformanceReport(orgId, startDate, endDate) {
    // Performance based on flow tests
    const statsQuery = `
    SELECT 
      AVG(static_pressure) as avg_static,
      AVG(flow_rate_gpm) as avg_flow
    FROM flow_tests
    WHERE organization_id = $1
    ${startDate && endDate ? 'AND test_date BETWEEN $2 AND $3' : ''}
  `;

    const params = [orgId];
    if (startDate && endDate) params.push(startDate, endDate);

    const result = await db.query(statsQuery, params);
    const stats = result.rows[0];

    return {
        title: 'System Performance Analysis',
        description: 'Hydrant performance metrics and flow test analysis',
        stats: {
            avg_static_pressure: parseFloat(stats.avg_static || 0).toFixed(1),
            avg_flow_rate: Math.round(stats.avg_flow || 0),
            class_aa_percentage: 0, // Implement classification logic
            class_a_percentage: 0,
            class_b_percentage: 0,
            class_c_percentage: 0
        },
        trends: []
    };
}

module.exports = router;
