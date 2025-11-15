# 🚀 HydrantHub Pre-Launch Checklist

**Complete this checklist before opening user signups**

Last Updated: November 14, 2025

---

## 🔴 Critical - Must Complete

### Database Setup
- [ ] Run consolidated schema: `psql -U hydrantuser -d hydrantdb -f database/schema.sql`
- [ ] Apply all migrations in order from `database/migrations/`
- [ ] Verify PostGIS extension is enabled
- [ ] Confirm all tables exist with correct columns
- [ ] Test database connectivity from backend

### Superadmin Account
- [ ] Create your first user account via `/register`
- [ ] Run promotion script: `node promote-superadmin.js rcabral85@gmail.com`
- [ ] Verify login with superadmin privileges
- [ ] Confirm admin panel access at `/admin`

### Environment Configuration
- [ ] Backend `.env` configured with all required variables (see ENV_VARIABLES.md)
- [ ] Frontend `.env` configured with correct API URL
- [ ] JWT secret is at least 32 characters and cryptographically secure
- [ ] CORS origins include production frontend URL
- [ ] `.env` files are NOT tracked in Git (confirm with `git status`)

### Frontend Dependencies
- [ ] Run `cd frontend && npm install` to install xlsx package
- [ ] Verify no npm errors or warnings
- [ ] Test local dev server: `npm run dev`
- [ ] Build production bundle: `npm run build`
- [ ] Verify no build errors

### Backend Dependencies
- [ ] Run `cd backend && npm install`
- [ ] Verify no npm errors or warnings
- [ ] Test local dev server: `npm run dev`
- [ ] Verify all routes respond correctly

---

## 🔵 User Flow Testing

### Organization Signup Flow
- [ ] Navigate to `/register`
- [ ] Complete Step 1: Organization Information
  - [ ] Enter organization name
  - [ ] Select organization type
  - [ ] Add optional details (address, phone, email)
- [ ] Complete Step 2: Admin Account
  - [ ] Enter first name, last name
  - [ ] Create username (3+ chars, alphanumeric)
  - [ ] Enter valid email
  - [ ] Create password (8+ chars)
  - [ ] Confirm password matches
- [ ] Submit registration
- [ ] Verify success message displays
- [ ] Verify redirect to login page
- [ ] Confirm organization created in database
- [ ] Confirm first user has admin role

### Login & Authentication
- [ ] Login with registered email and password
- [ ] Verify JWT token is stored in localStorage
- [ ] Verify redirect to dashboard
- [ ] Confirm user data loads correctly
- [ ] Test logout functionality
- [ ] Verify token is removed on logout
- [ ] Test login with invalid credentials (should fail)
- [ ] Test accessing protected routes without token (should redirect to login)

### Dashboard Testing
- [ ] Navigate to `/dashboard`
- [ ] Verify metrics load from `/api/dashboard/metrics` (not hardcoded)
- [ ] Confirm Total Hydrants count is accurate
- [ ] Confirm Active Hydrants count is accurate
- [ ] Confirm Flow Tests (7 days) count is accurate
- [ ] Confirm Tests Due (30 days) count is accurate
- [ ] Verify NFPA distribution chart displays correctly
- [ ] Admin: Verify Work Order status displays (if admin)
- [ ] Operator: Verify admin-only sections are hidden (if operator)
- [ ] Test PDF export functionality

### Role-Based Access Control
- [ ] **As Admin/Superadmin:**
  - [ ] Verify navigation shows: Dashboard, Map, Inspections, Flow Test, Maintenance, Reports
  - [ ] Verify Hydrants dropdown menu appears
  - [ ] Confirm access to `/maintenance`
  - [ ] Confirm access to `/reports`
  - [ ] Confirm access to `/hydrants/import`
  - [ ] Superadmin only: Confirm access to `/admin`

- [ ] **As Operator:**
  - [ ] Create test operator account
  - [ ] Login as operator
  - [ ] Verify navigation shows: Dashboard, Map, Inspections, Flow Test
  - [ ] Verify Maintenance, Reports are NOT visible
  - [ ] Verify Hydrants dropdown is NOT visible
  - [ ] Attempt to access `/maintenance` directly (should show access denied)
  - [ ] Attempt to access `/reports` directly (should show access denied)
  - [ ] Attempt to access `/hydrants/import` directly (should show access denied)
  - [ ] Attempt to access `/admin` directly (should show access denied)

### Map Functionality
- [ ] Navigate to `/map`
- [ ] Verify hydrants load and display on map
- [ ] Test toggle between "NFPA Classification" and "Work Status" views
- [ ] Verify NFPA view shows correct color coding:
  - [ ] Class AA: Blue
  - [ ] Class A: Green
  - [ ] Class B: Orange
  - [ ] Class C: Red
- [ ] Verify Work Status view shows correct color coding:
  - [ ] Compliant: Green
  - [ ] Due Soon: Yellow
  - [ ] Overdue: Red
  - [ ] Needs Maintenance: Dark Red
  - [ ] Out of Service: Gray
- [ ] Click on hydrant marker and verify popup displays
- [ ] Test "Add Mode" - click FAB, then click map to add hydrant
- [ ] Test map refresh functionality

### Bulk Import Testing
- [ ] Navigate to `/hydrants/import` (admin only)
- [ ] Prepare test CSV file with required columns:
  ```csv
  hydrant_number,address,latitude,longitude,manufacturer,model,year_installed,size_inches,outlet_count,nfpa_class,available_flow_gpm
  H-TEST-001,"123 Test St, Milton ON",43.5182,-79.8774,Mueller,Super Centurion,2020,6,2,A,1200
  H-TEST-002,"456 Demo Ave, Milton ON",43.5190,-79.8780,AVK,Series 2780,2019,6,2,B,850
  ```
- [ ] Upload CSV file
- [ ] Verify file parses and displays preview table
- [ ] Click "Validate Data"
- [ ] Verify validation results show (valid count, error count)
- [ ] Review any validation errors
- [ ] Click "Commit Import"
- [ ] Verify success message
- [ ] Confirm hydrants appear in database
- [ ] Confirm hydrants appear on map
- [ ] View import history
- [ ] Verify import record saved with correct counts

### Flow Test Creation
- [ ] Navigate to `/flow-test`
- [ ] Select a hydrant from dropdown
- [ ] Enter test date
- [ ] Enter static pressure (e.g., 65 PSI)
- [ ] Enter residual pressure (e.g., 45 PSI)
- [ ] Add outlet 1: size 2.5", pitot 42 PSI, coefficient 0.9
- [ ] Add outlet 2: size 2.5", pitot 38 PSI, coefficient 0.9
- [ ] Enter weather conditions and temperature
- [ ] Submit form
- [ ] Verify NFPA 291 calculations are correct
- [ ] Verify test number is auto-generated
- [ ] Confirm test appears in database
- [ ] Verify hydrant NFPA class updates on map

### Inspection Testing
- [ ] Navigate to `/inspections`
- [ ] Create new inspection
- [ ] Select hydrant
- [ ] Choose inspection type (visual/operational)
- [ ] Enter inspection findings
- [ ] Upload photo (if supported)
- [ ] Submit inspection
- [ ] Verify inspection saves to database
- [ ] Confirm inspection appears in hydrant details

---

## 🟡 Important - Should Complete

### API Endpoint Testing

Test all critical endpoints:

```bash
# Health check
curl https://hydrant-management-production.up.railway.app/api/health

# Dashboard metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://hydrant-management-production.up.railway.app/api/dashboard/metrics

# List hydrants
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://hydrant-management-production.up.railway.app/api/hydrants

# Organization signup
curl -X POST https://hydrant-management-production.up.railway.app/api/org-signup/signup \
  -H "Content-Type: application/json" \
  -d '{"organization_name":"Test Org","admin_email":"test@example.com","admin_password":"TestPass123","admin_first_name":"Test","admin_last_name":"User"}'
```

### Mobile Responsiveness
- [ ] Test on mobile device (phone)
- [ ] Test on tablet
- [ ] Verify navigation menu collapses correctly
- [ ] Test mobile inspection forms
- [ ] Verify map interactions work on touch devices
- [ ] Test form inputs and dropdowns on mobile

### Performance Testing
- [ ] Load test with 100+ hydrants
- [ ] Verify map renders smoothly
- [ ] Test pagination on lists
- [ ] Check API response times (<500ms)
- [ ] Verify no memory leaks in browser

### Error Handling
- [ ] Test with invalid API URL
- [ ] Test with expired JWT token
- [ ] Test form validation errors
- [ ] Test API error messages display correctly
- [ ] Verify 404 page for invalid routes
- [ ] Test network timeout scenarios

---

## 🟢 Optional - Post-Launch

### Documentation
- [ ] Update README.md with latest features
- [ ] Add API documentation
- [ ] Create user guide/manual
- [ ] Add video tutorials
- [ ] Create FAQ section

### Email System (If Implemented)
- [ ] Test user invitation emails
- [ ] Test password reset emails
- [ ] Test organization signup confirmation emails
- [ ] Verify email templates render correctly
- [ ] Test email delivery to different providers (Gmail, Outlook, etc.)

### Security Audit
- [ ] Run npm audit and fix vulnerabilities
- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Verify CSRF protection
- [ ] Test rate limiting on auth endpoints
- [ ] Review JWT token security
- [ ] Check HTTPS/SSL configuration
- [ ] Verify secure cookie settings

### Monitoring & Logging
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Configure uptime monitoring
- [ ] Set up performance monitoring
- [ ] Create alerting for critical errors
- [ ] Set up database backup schedule

### Legal & Compliance
- [ ] Add Terms of Service page
- [ ] Add Privacy Policy page
- [ ] Add Cookie Policy (if using cookies)
- [ ] Ensure GDPR compliance (if serving EU users)
- [ ] Add data retention policy

---

## ✅ Sign-Off

**Before launching user signups, confirm:**

- [ ] All items in "Critical - Must Complete" section are done
- [ ] All items in "User Flow Testing" section pass
- [ ] Production environment is configured correctly
- [ ] Database backups are scheduled
- [ ] Error monitoring is active
- [ ] Support email is monitored
- [ ] You can successfully create a new organization and user
- [ ] You can successfully login and use all core features
- [ ] Role-based access control works as expected
- [ ] Dashboard shows real data, not hardcoded values

**Signed off by:** ___________________  
**Date:** ___________________  

---

## 📞 Support

If any checklist item fails:
1. Check the troubleshooting section in TESTING.md
2. Review backend logs: Railway dashboard or `npm run dev` output
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
5. Ensure database schema is up to date

**Questions?** Contact: rcabral85@gmail.com

---

**Built by water operators for water operators** 🔥💧
