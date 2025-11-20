# Fixes for Logout and Maintenance Page Errors

## Issue 1: Logout Not Functioning Properly

### Problem
The logout function clears localStorage but immediately redirects, which can cause race conditions and the user still appears logged in.

### Solution
Update `frontend/src/contexts/AuthContext.jsx` - Change the logout function:

```javascript
// Logout function - FIXED VERSION
const logout = async () => {
  try {
    // Clear all localStorage items FIRST
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('hydrantHub_token');
    localStorage.removeItem('hydrantHub_refreshToken');
    localStorage.removeItem('hydrantHub_user');
    
    // Call authService logout
    authService.logout();
    
    // Dispatch logout action
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Show toast notification
    toast.info('You have been logged out.');
    
    // Wait a moment to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Use React Router navigation instead of window.location
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if there's an error
    localStorage.clear();
    window.location.href = '/login';
  }
};
```

## Issue 2: Maintenance Page Error - "User not found"

### Problem
The maintenance endpoints check for `req.user.id` but don't handle cases where the user object exists but the database query fails. The error message "User not found" is returned when the organization_id lookup fails.

### Solution 1: Update `backend/routes/maintenance.js`

Replace the three problematic endpoints with better error handling:

#### Fix for `/inspections` endpoint (line ~531):

```javascript
// Get all inspections for the organization
router.get('/inspections',
  authMiddleware,
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
          h.location_address,
          it.name as inspection_type
        FROM maintenance_inspections mi
        JOIN hydrants h ON mi.hydrant_id = h.id
        JOIN inspection_types it ON mi.inspection_type_id = it.id
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
```

#### Fix for `/work-orders` endpoint (line ~575):

```javascript
// Get all work orders for the organization  
router.get('/work-orders',
  authMiddleware,
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
          h.location_address,
          CASE 
            WHEN rwo.status = 'COMPLETED' THEN 100
            WHEN rwo.status = 'IN_PROGRESS' THEN 50
            WHEN rwo.status = 'SCHEDULED' THEN 25
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
          rwo.created_date DESC
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
```

#### Fix for `/stats` endpoint (line ~633):

```javascript
// Get maintenance statistics for the organization
router.get('/stats',
  authMiddleware,
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
          SUM(CASE WHEN status = 'SCHEDULED' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
        FROM repair_work_orders
        JOIN hydrants h ON repair_work_orders.hydrant_id = h.id
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
```

### Solution 2: Update Frontend Error Handling

Update `frontend/src/components/MaintenanceDashboard.jsx` to handle errors better:

```javascript
const fetchDashboardData = async () => {
  try {
    setLoading(true);
    
    // Fetch multiple endpoints concurrently with better error handling
    const [statsRes, scheduleRes, workOrdersRes, complianceRes] = await Promise.allSettled([
      API.get('/maintenance/stats'),
      API.get('/maintenance/compliance/schedule?status=SCHEDULED&end_date=' + 
             new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      API.get('/maintenance/work-orders?status=IN_PROGRESS,SCHEDULED&limit=10'),
      API.get('/maintenance/compliance/report?start_date=' + 
             new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] +
             '&end_date=' + new Date().toISOString().split('T')[0])
    ]);

    // Check for authentication errors
    const hasAuthError = [statsRes, scheduleRes, workOrdersRes, complianceRes].some(
      result => result.status === 'rejected' && 
                (result.reason?.response?.status === 401 || 
                 result.reason?.response?.status === 404)
    );

    if (hasAuthError) {
      console.error('Authentication error detected, redirecting to login');
      window.location.href = '/login';
      return;
    }

    // Process the data with fallbacks
    const statsData = statsRes.status === 'fulfilled' ? statsRes.value.data : { stats: {} };
    const scheduleData = scheduleRes.status === 'fulfilled' ? scheduleRes.value.data : { schedule: [] };
    const workOrdersData = workOrdersRes.status === 'fulfilled' ? workOrdersRes.value.data : { work_orders: [] };
    const complianceData = complianceRes.status === 'fulfilled' ? complianceRes.value.data : { report: { summary: {} } };

    const upcomingInspections = (scheduleData.schedule || []).filter(
      item => new Date(item.due_date) > new Date() && item.status === 'SCHEDULED'
    ).slice(0, 10);
    
    const overdueInspections = (scheduleData.schedule || []).filter(
      item => new Date(item.due_date) < new Date() || item.status === 'OVERDUE'
    );

    setDashboardData({
      stats: statsData.stats || {},
      upcomingInspections,
      overdueInspections,
      activeWorkOrders: workOrdersData.work_orders || [],
      complianceMetrics: complianceData.report?.summary || {}
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    // Check if it's an auth error
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.error('Session expired or user not found, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    // Show error to user
    alert('Failed to load maintenance data: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};
```

## Testing Steps

### Test Logout Fix:
1. Log into the application
2. Click logout
3. Verify you are redirected to /login
4. Check browser localStorage (F12 > Application > Local Storage) - should be empty
5. Try to navigate back to /dashboard - should redirect to /login
6. Log in again - should work without issues

### Test Maintenance Page Fix:
1. Log into the application
2. Navigate to the Maintenance page
3. Verify the page loads without "User not found" error
4. Check that inspections, work orders, and stats load correctly
5. If you get an error, check the browser console for detailed error messages
6. Verify error messages are user-friendly and actionable

## Additional Recommendations

1. **Add session timeout detection**: Implement a global axios interceptor to catch 401 errors
2. **Add loading states**: Show skeleton loaders while data is fetching
3. **Add retry logic**: Automatically retry failed requests once before showing error
4. **Improve logging**: Add more detailed logging for debugging production issues

## Files to Update

1. `frontend/src/contexts/AuthContext.jsx` - Logout function
2. `backend/routes/maintenance.js` - All three endpoint error handlers
3. `frontend/src/components/MaintenanceDashboard.jsx` - fetchDashboardData function

## Priority

Both fixes should be applied together as they address the root cause of the issues you're experiencing.