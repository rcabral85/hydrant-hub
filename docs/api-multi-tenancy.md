# HydrantHub Multi-Tenancy API Documentation

## Authentication
- All secured endpoints require a JWT Bearer token in the Authorization header:
  `Authorization: Bearer <token>`
- JWT must include `organization_id`, `user_id`, `role`.

## Organization-Aware Endpoints
- All GET, POST, PUT, DELETE requests are scoped using organization_id from JWT/middleware.
- Org isolation is enforced by backend on all queries/writes.

---
### GET /api/hydrants
Returns all hydrants for the requesting user's organization. Supports pagination and filters.

**Example response:**
```json
{
  "hydrants": [
    { "id": "...", "hydrant_number": "MLT-001", "organization_id": "org-uuid", ... }
  ]
}
```

### POST /api/hydrants
Creates a new hydrant for current organization (organization_id auto-populated)

**Required body:**
```json
{
  "hydrant_number": "ABC-123",
  "latitude": 43.5,
  "longitude": -79.8,
  ... // other hydrant fields
}
```

### GET /api/maintenance
Returns all maintenance inspections for current organization.

### GET /api/work-orders
Returns all work orders for current organization.

### GET /api/flow-tests
Returns all flow tests for current organization.

### GET /api/hydrants/:id/history
Returns hydrant's maintenance/flow test history for only current org's hydrant.

---
## Onboarding New Organizations
Use provided script (see `database/scripts/onboard_new_org.sh`) to create and initialize new clients and admin accounts.

---
## Onboarding Steps
1. Organization created in DB (with admin user)
2. Admin logs in, generates JWT scoped to their org
3. All API requests return only their own organization's hydrants, tests, inspections, work orders

---
## Security Notes
- Backend enforces org isolation at query level; frontend does not need to filter manually.
- Ensure orgAuthMiddleware is registered globally for all secured endpoints.
