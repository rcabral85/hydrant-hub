# Multi-Tenancy Checklist for HydrantHub Rollout

## Backend
- [x] Database migration: organization_id columns with bulk demo update
- [x] Organization-aware JWT auth middleware (backend/middleware/org-auth-middleware.js)
- [ ] API endpoints query all tables using organization_id from req.user
- [x] Example org-scoped hydrant query code provided
- [ ] All data-modifying endpoints (create, update, delete) require/request organization_id
- [ ] Auth middleware added to all secured routes (app.use)

## Onboarding
- [x] Script for onboarding new clients/orgs and admin users (database/scripts/onboard_new_org.sh)
- [ ] Document onboarding flow for new customer (API + script)

## Testing
- [ ] Create Postman collection: test with multiple orgs, verify complete data separation
- [ ] UI/UX verification: user only sees their own org’s hydrants/records
- [ ] QA: try adding, editing, deleting as admin/operator for new org

## Docs
- [ ] Update README with multi-tenancy deployment, onboarding, API filtering instructions
- [ ] Sample workflow for adding new real client

---
This checklist covers all steps to migrate from sample/demo data to real production client onboarding!
