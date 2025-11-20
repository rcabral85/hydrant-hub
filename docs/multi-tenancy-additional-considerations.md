# Multi-Tenancy: Additional Considerations & TODO

## Backend / API
- [ ] Update all POST/PUT/DELETE endpoints to always inject organization_id (from req.user) in new records
- [ ] Validate that organization_id cannot be changed or forged by users on update
- [ ] Lock down legacy endpoints or routes that do not check organization_id
- [ ] Add automated tests or logging to guard against cross-org data leakage

## Frontend
- [ ] Ensure org context is passed or auto-injected after login
- [ ] Filter dashboard views, listings, and dropdowns by organization_id
- [ ] Hide or disable UI features unavailable for current org (roles, paid features)

## Onboarding / Admin
- [ ] Script for auto-generating demo hydrant data for new org sign-ups
- [ ] Admin dashboard to review orgs and users, deactivate old organizations or accounts

## Security
- [ ] Use scoped JWTs for all authentication, JWT must always have organization_id
- [ ] Add request logging so all API hits log user_id and org_id
- [ ] Document audit triggers for cross-client compliance

## Testing
- [ ] Add migration tests to ensure organization_id is set for all legacy/demo data
- [ ] QA with fresh orgs: create, inspect, flow test, and work orders—validate total data separation

---
Add or tweak this list as you implement to ensure nothing is missed when moving to production multi-tenancy.