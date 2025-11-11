# HydrantHub Multi-Tenancy Frontend Integration Guide

## Core Principles
- The backend enforces org isolation—all API requests only return the user's organization data
- Frontend should always send JWT tokens (login required)
- Automatically scope all dashboard, list, and map pages by org (by requesting all data without orgId filter—backend will handle it)

## Login Flow
- After user authenticates, token should be stored securely (localStorage, session, or client state only)
- Profile endpoint (`/api/auth/me`) can be used to retrieve org name, role, etc.

## UI Patterns
- Display org name in app header or profile page
- Restrict UI options (admin/operator/supervisor) based on role from `/api/auth/me` response
- Hide features unavailable to role/org (example: admin-only settings, limited history for viewers)

## Client Onboarding (New Org)
- Admin receives credentials (from backend/onboarding script)
- Admin logs in and adds operator accounts for their org
- All further hydrant/test/inspection/work order data will belong exclusively to their organization

## Testing & QA
- Log in with multiple user/orgs and verify total data separation in all views and export/download features
- No organization switching UI is required (unless you plan for multi-tenancy at the user level)

## For Advanced SaaS UI Features
- Create admin dashboard to review/manage orgs and users (see backend TODOs)
- Add feature flags/paid upgrades tied to org level

---
**Ready for Production Use:**
If you want sample React/JS code to handle login, JWT storage, org header/role handling, or onboarding, just ask!
