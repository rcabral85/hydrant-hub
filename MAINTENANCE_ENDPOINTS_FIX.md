# Maintenance Page Error Fix - Missing Backend Endpoints

## Problem Summary

The MaintenancePage is displaying the error:
```
Failed to load maintenance data: User not found. Please check your connection and try refreshing.
```

## Root Cause

The frontend `MaintenancePage.jsx` is calling backend endpoints that **don't exist** in `maintenance.js`:

**Frontend calls (line 51-54 in MaintenancePage.jsx):**
```javascript
const [inspectionsRes, workOrdersRes, statsRes, complianceRes] = await Promise.all([
  api.get('/maintenance/inspections'),      // ❌ MISSING
  api.get('/maintenance/work-orders'),      // ❌ MISSING  
  api.get('/maintenance/stats'),            // ❌ MISSING
  api.get('/maintenance/compliance/schedule') // ✅ EXISTS
]);
```

**Backend endpoints that exist:**
- `/maintenance/inspections/hydrant/:hydrantId` - requires specific hydrant
- `/maintenance/work-orders/hydrant/:hydrantId` - requires specific hydrant
- `/maintenance/compliance/schedule` - ✅ works
- `/maintenance/stats` - ❌ DOES NOT EXIST

## Solution

Add three new general endpoints to `/backend/routes/maintenance.js` at **line 431** (before the "WORK ORDER MANAGEMENT" comment section).

---

## Code to Add

Insert this code at line 431 in `/backend/routes/maintenance.js`:

```javascript
// =============================================
// GENERAL MAINTENANCE ENDPOINTS
// =============================================

// Get all inspections for the organization
router.get('/inspections',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          mi.*,
          h.hydrant_number,
          h.location_address,
          it.name as inspection_type
        FROM maintenance_inspections mi
        JOIN hydrants h ON mi.hydrant_id = h.id
        JOIN inspection_types it ON mi.inspection_type_id = it.id
        ORDER BY mi.inspection_date DESC
        LIMIT 50
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all inspections:', error);
      res.status(500).json({ error: 'Failed to fetch inspections' });
    }
  }
);

// Get all work orders for the organization  
router.get('/work-orders',
  authMiddleware,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT 
          rwo.*,
          h.hydrant_number,
          h.location_address,
          CASE 
            WHEN rwo.status = 'COMPLETED' THEN 100
            WHEN rwo.status = 'IN_PROGRESS' THEN 50
            WHEN rwo.status = 'SCHEDULED' THEN 25
            ELSE 0
          END as progress
        FROM repair_work_orders rwo
        JOIN hydrants h ON rwo.hydrant_id = h.id
        ORDER BY 
          CASE rwo.priority 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
          END,
          rwo.created_date DESC
        LIMIT 50
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all work orders:', error);
      res.status(500).json({ error: 'Failed to fetch work orders' });
    }
  }
);

// Get maintenance statistics for the organization
router.get('/stats',
  authMiddleware,
  async (req, res) => {
    try {
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM repair_work_orders
      `);

      res.json(statsResult.rows[0] || { total: 0, scheduled: 0, in_progress: 0, completed: 0 });
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

```

---

## Implementation Steps

1. Open `/backend/routes/maintenance.js` in VS Code
2. Navigate to line 431 (just before the "WORK ORDER MANAGEMENT" comment)
3. Paste the code above
4. Save the file
5. Commit and push to the `fix-maintenance-endpoints` branch
6. Test locally or deploy to Railway

## Testing

After implementing:
1. Navigate to the Maintenance page
2. The page should load without errors
3. You should see stats cards with counts
4. Inspections and work orders tables should display data

## Notes

- All three endpoints use `authMiddleware` for authentication
- Queries are limited to 50 records for performance
- Returns empty arrays/default objects if no data exists
- Error handling returns 500 status with descriptive messages
