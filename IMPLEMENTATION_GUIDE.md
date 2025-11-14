# Implementation Guide for Issues #11, #14, #15

## Overview
This guide covers the implementation of ESLint configuration, role-based access control,
bulk hydrant import, real dashboard metrics, and dual map views.

## Completed Work

### ✅ Phase 1: ESLint Configuration (Issues #14, #15)
- `backend/.eslintrc.js` - Node.js ESLint config
- `frontend/.eslintrc.js` - React ESLint config  
- Both follow best practices with proper plugins

### ✅ Phase 2: Database Migration (Issue #11)
- `database/migrations/002_enhance_rbac.sql`
  - Simplified user roles to `admin` and `operator`
  - Added `is_superadmin` flag
  - Created `hydrant_imports` table
  - Set rcabral85 as superadmin

### ✅ Phase 3: Backend Implementation (Issue #11)
- `backend/middleware/roleCheck.js` - RBAC middleware
- `backend/routes/hydrantImport.js` - Bulk CSV/Excel imports
- `backend/routes/dashboard.js` - Real-time metrics

## Next Steps

### Step 1: Run Database Migration
```bash
psql <your_database_url>
\i database/migrations/002_enhance_rbac.sql
```

### Step 2: Update server.js
Add new routes in `backend/server.js`:

```javascript
const hydrantImportRoutes = require('./routes/hydrantImport');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/hydrants/import', hydrantImportRoutes);
app.use('/api/dashboard', dashboardRoutes);
```

### Step 3: Test ESLint
```bash
cd backend && npm run lint
cd frontend && npm run lint
```

### Step 4: Frontend Implementation

See separate sections below for:
- Dashboard with real data
- Bulk import component
- Role-based navigation
- Dual map views

## CSV Import Format

Required columns:
- hydrant_number
- address

Optional columns:
- latitude, longitude
- manufacturer, model
- year_installed
- size_inches
- outlet_count
- nfpa_class
- available_flow_gpm

## Testing Checklist

- [ ] ESLint passes
- [ ] Database migration successful
- [ ] Dashboard shows real data
- [ ] Bulk import works
- [ ] Admin has full access
- [ ] Operator has limited access
- [ ] rcabral85 is superadmin
- [ ] Two map views functional
- [ ] Navigation role-based
