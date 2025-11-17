# Hydrant Hub - Production Cleanup & Implementation Plan

## Overview

This document outlines the complete restructuring of Hydrant Hub to create a clean, fully functional production application. The new `production-clean-v2` branch represents a systematic cleanup and connection of all features.

## Database Changes

### ✅ Completed: Unified Schema

**File:** `database/production-schema.sql`

This single schema file replaces all fragmented schema files:
- ~~schema.sql~~ (replaced)
- ~~maintenance-schema.sql~~ (replaced)
- ~~create-maintenance-tables.sql~~ (replaced)
- ~~quick-fix-schema.sql~~ (replaced)

### Key Schema Features:

1. **Simplified Maintenance System** - One `maintenance_inspections` table handles:
   - Quick inspections from map
   - Full inspection forms  
   - Work orders
   - Repair tracking
   
2. **Subscription Management** - Added to `organizations` table:
   - `subscription_tier` (free, starter, professional, enterprise)
   - `hydrant_limit` (enforces 50 hydrant limit for free tier)
   - `subscription_start_date` and `subscription_end_date`

3. **User Invitation System** - Added to `users` table:
   - `invited_by` (tracks who sent invitation)
   - `invitation_token` (secure token for email links)
   - `invitation_expires` (token expiration)

4. **Dashboard View** - New `dashboard_stats` view provides:
   - Total/active hydrant counts
   - Recent activity (last 30 days)
   - Work order statistics
   - Compliance/overdue tracking

## Files to Delete

### Documentation (Move to `/docs` folder):
- CONTRIBUTING.md
- ENV_VARIABLES.md
- FIXES-LOGOUT-MAINTENANCE.md
- HYDRANT_ADD_IMPROVEMENTS.md
- IMPLEMENTATION_GUIDE.md
- MAINTENANCE_ENDPOINTS_FIX.md
- MAINTENANCE_MODULE.md
- PRE_LAUNCH_CHECKLIST.md
- RAILWAY_FIXES.md
- SETUP.md
- SUPERADMIN_IMPLEMENTATION.md
- TESTING.md
- UPGRADE_IMPLEMENTATION.md
- hydrant-hub-guide.md
- multi-tenancy-additional-considerations.md
- multi-tenancy-rollout-checklist.md

### Example/Snippet Files (Delete entirely):
- backend/routes/*-org-example.js (all 5 files)
- backend/server-org-middleware-snippet.js
- mobile-nav-integration-example.html
- promote-superadmin.js (move to scripts/)

### Old Schema Files (Delete after migration):
- database/schema.sql
- database/maintenance-schema.sql
- database/create-maintenance-tables.sql
- database/quick-fix-schema.sql
- database/create-admin-user.sql

### Duplicate Components (Keep only one version):
- frontend/src/components/Dashboard.jsx (KEEP)
- frontend/src/components/EnhancedDashboard.jsx (DELETE)
- frontend/src/components/HydrantMap.jsx (DELETE)
- frontend/src/components/HydrantMapEnhanced.jsx (KEEP - rename to HydrantMap.jsx)
- frontend/src/components/MobileInspection.jsx (DELETE)
- frontend/src/components/MobileInspectionMUI.jsx (KEEP)

## Backend API Updates

### 1. Remove Duplicate Maintenance Routes from server.js

**File:** `backend/server.js`

Delete lines 93-199 (all the inline maintenance route handlers). These are already properly implemented in `backend/routes/maintenance.js`.

### 2. Fix Maintenance Routes

**File:** `backend/routes/maintenance.js`

Changes needed:
1. Remove `inspector_license` field (doesn't exist in new schema)
2. Update inspection POST to match simplified schema
3. Fix work order queries to use new unified structure
4. Remove references to `inspection_types` and `compliance_schedule` tables (not created yet)

### 3. Add Missing API Endpoints

**File:** `backend/routes/admin.js` (expand)

Add:
```javascript
// POST /api/admin/invite-operator
// - Generate invitation token
// - Send email with signup link
// - Store invitation in database

// GET /api/admin/users
// - List all users in organization
// - Include invitation status

// PUT /api/admin/users/:id
// - Update user role
// - Activate/deactivate user
```

**File:** `backend/routes/dashboard.js` (update)

Replace hardcoded stats with:
```javascript
// GET /api/dashboard/stats
// Query: dashboard_stats VIEW
// Returns: Live statistics for organization

// GET /api/dashboard/recent-activity
// Query: Last 10 inspections + flow tests + work orders
// Returns: Activity feed with timestamps
```

### 4. Add Hydrant Limit Enforcement

**File:** `backend/routes/hydrants.js`

In the POST /api/hydrants endpoint, add before creating hydrant:

```javascript
// Check hydrant limit
const orgResult = await pool.query(
  'SELECT hydrant_limit FROM organizations WHERE id = $1',
  [organizationId]
);

const countResult = await pool.query(
  'SELECT COUNT(*) as count FROM hydrants WHERE organization_id = $1',
  [organizationId]
);

if (countResult.rows[0].count >= orgResult.rows[0].hydrant_limit) {
  return res.status(403).json({
    error: 'Hydrant limit reached',
    message: `Your current plan allows ${orgResult.rows[0].hydrant_limit} hydrants. Please upgrade to add more.`,
    upgradeUrl: '/upgrade'
  });
}
```

## Frontend Updates

### 1. Connect Reports Page to Live Data

**File:** `frontend/src/components/ReportsPage.jsx`

Replace hardcoded stats (lines 10-50) with API calls:

```javascript
useEffect(() => {
  const fetchStats = async () => {
    const response = await api.get('/api/dashboard/stats');
    setStats(response.data);
  };
  fetchStats();
}, []);
```

### 2. Connect Maintenance Page to Backend

**File:** `frontend/src/components/MaintenancePage.jsx`

Update to fetch from:
- `/api/maintenance/inspections` - For inspection list
- `/api/maintenance/work-orders` - For work order list  
- `/api/maintenance/stats` - For statistics cards

### 3. Fix Map Inspection Quick Modal

**File:** `frontend/src/components/MaintenanceQuickModal.jsx`

Update submission to POST to `/api/maintenance/inspections` with proper payload:

```javascript
const submitInspection = async () => {
  const formData = {
    hydrant_id: selectedHydrant.id,
    inspection_type: 'QUICK_MAINTENANCE',
    inspector_name: user.name,
    inspection_date: new Date().toISOString(),
    paint_condition: paintCondition,
    body_condition: bodyCondition,
    cap_condition: capCondition,
    // ... all other fields
  };
  
  await api.post('/api/maintenance/inspections', formData);
  onClose();
  refreshHydrants();
};
```

### 4. Add Admin User Management

**File:** `frontend/src/pages/AdminDashboard.jsx` (expand)

Add sections:
1. **Invite Operator** button → Opens modal with email field
2. **User List** table with edit/deactivate actions
3. **Subscription Info** panel showing current tier and usage

### 5. Add Upgrade Prompt

**File:** `frontend/src/components/UpgradeModal.jsx` (new)

Create modal shown when hydrant limit reached:
- Display current usage (45/50 hydrants)
- Show subscription tiers and pricing
- "Upgrade Now" button (prepare for Stripe integration)

## Railway Deployment Updates

### Environment Variables

Ensure Railway has:
```
DATABASE_URL=postgresql://...
NODE_ENV=production
JWT_SECRET=your-secret-key
FRONTEND_URL=https://stunning-cascaron-f49a60.netlify.app
PORT=5000
```

### Database Migration Script

**File:** `backend/scripts/migrate-to-production-schema.js` (new)

```javascript
// 1. Backup current data
// 2. Run production-schema.sql
// 3. Migrate existing maintenance records to new structure
// 4. Verify data integrity
```

## Netlify Deployment

No changes needed - keep existing configuration:
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL` → Railway backend URL

## Implementation Priority

### Phase 1: Database & Core API (Week 1)
1. ✅ Create production-schema.sql
2. Run migration script on Railway
3. Update maintenance.js routes
4. Remove duplicate routes from server.js
5. Add hydrant limit enforcement

### Phase 2: Frontend Connections (Week 1-2)
1. Fix Reports page to pull live data
2. Connect MaintenancePage to backend
3. Wire up map quick inspections
4. Test full inspection form submission
5. Verify dashboard displays correctly

### Phase 3: User Management (Week 2)
1. Build admin invite operator feature
2. Create user management UI
3. Implement invitation email system
4. Add role management

### Phase 4: Subscription System (Week 3)
1. Create upgrade modal
2. Add subscription tier display
3. Implement usage tracking
4. Prepare Stripe integration (Phase 5)

### Phase 5: Polish & Testing (Week 3-4)
1. End-to-end testing of all flows
2. Fix any remaining bugs
3. Performance optimization
4. Documentation updates
5. User acceptance testing

## Testing Checklist

### Critical User Flows to Test:

- [ ] Register new organization
- [ ] Login as admin
- [ ] Add individual hydrant
- [ ] Import hydrants via CSV
- [ ] Click hydrant on map → Quick inspection
- [ ] Submit full inspection form
- [ ] View inspection on Maintenance page
- [ ] Create work order
- [ ] Complete work order
- [ ] View reports with live data
- [ ] Invite operator
- [ ] Operator accepts invitation
- [ ] Operator submits inspection
- [ ] Hit 50 hydrant limit → See upgrade prompt
- [ ] Admin views subscription info

## File Organization

### Keep These Essential Files:

**Root:**
- README.md
- LICENSE
- .gitignore
- netlify.toml
- docker-compose.yml (for local dev)

**Backend:**
- backend/server.js
- backend/package.json
- backend/config/
- backend/middleware/
- backend/routes/ (remove example files)
- backend/scripts/

**Frontend:**
- frontend/src/
- frontend/public/
- frontend/package.json
- frontend/vite.config.js

**Database:**
- database/production-schema.sql (main)
- database/sample-hydrant-data.sql (for testing)
- database/scripts/

**Docs:** (create this folder)
- docs/API_DOCUMENTATION.md
- docs/DEPLOYMENT.md
- docs/TESTING_GUIDE.md
- docs/USER_GUIDE.md

## Success Criteria

The branch is ready for production when:

1. ✅ Single, consolidated database schema deployed
2. ✅ All API endpoints tested and working
3. ✅ Frontend connects to all backend services
4. ✅ Map inspections save to database
5. ✅ Reports show live data
6. ✅ Maintenance page displays real work orders
7. ✅ Admin can invite operators
8. ✅ Hydrant limit enforced at 50
9. ✅ No duplicate or unnecessary files
10. ✅ Railway + Netlify deployments stable

## Next Steps

1. Review this plan
2. Test database migration locally first
3. Deploy schema to Railway staging environment
4. Make backend route updates
5. Test API endpoints with Postman
6. Update frontend components
7. End-to-end testing
8. Deploy to production

---

**Branch:** `production-clean-v2`  
**Created:** November 17, 2025  
**Status:** In Progress  
**Target Completion:** 2-3 weeks