# Changelog

All notable changes to the HydrantHub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Organization context middleware (`backend/middleware/orgContext.js`) to eliminate repetitive database queries
- GitHub Actions CI/CD workflow for automated testing, linting, and deployment
- Enhanced Vite configuration with code splitting and production optimizations
- API proxy configuration in Vite for seamless development experience
- Comprehensive error logging with timestamps and request context
- Graceful shutdown handlers for database connections
- Environment variable configuration for CORS origins

### Changed
- **BREAKING**: CORS configuration now uses `ALLOWED_ORIGINS` environment variable instead of hardcoded URLs
- Refactored maintenance routes to use new organization context middleware
- Moved all inline maintenance endpoints from `server.js` to `routes/maintenance.js`
- Improved error handler with detailed server-side logging
- Enhanced startup logging with emoji indicators and health check status
- Updated `.env.example` with `ALLOWED_ORIGINS` configuration and production examples

### Removed
- Duplicate `/api/tests` route (consolidated to `/api/flow-tests` only)
- Inline maintenance route handlers from `server.js` (moved to dedicated routes file)
- Repetitive organization ID queries across maintenance endpoints
- Hardcoded CORS whitelist from server configuration

### Fixed
- Code duplication in maintenance endpoints requiring organization validation
- Security concern with hardcoded production URLs in server code
- Missing error context in production error logs
- Lack of graceful shutdown for database connections

### Security
- Moved CORS origins to environment variables for better security
- Disabled sourcemaps in production builds
- Added security audit step to CI/CD pipeline
- Enhanced error handling to prevent information leakage in production

### Performance
- Implemented manual chunk splitting in Vite for better caching
- Separated vendor, UI, maps, and charts into dedicated bundles
- Optimized dependency pre-bundling in Vite
- Reduced server.js file size by ~43% (11.4KB → 6.6KB)

## Migration Guide

### Environment Variables

If you're updating from a previous version, update your `.env` file:

**Before:**
```bash
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

**After:**
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### API Routes

The `/api/tests` route has been removed. Use `/api/flow-tests` instead:

**Before:**
```javascript
fetch('/api/tests')  // ❌ No longer available
```

**After:**
```javascript
fetch('/api/flow-tests')  // ✅ Correct
```

### Custom Middleware

If you have custom routes that need organization context, use the new middleware:

```javascript
const { authenticateToken } = require('./middleware/auth');
const { attachOrgContext } = require('./middleware/orgContext');

router.get('/my-route', authenticateToken, attachOrgContext, (req, res) => {
  // Organization ID is now available as req.organizationId
  const orgId = req.organizationId;
  // No need to query the database for it!
});
```

## [1.0.0] - 2025-11-18

### Initial Release
- Fire hydrant flow testing and management platform
- NFPA 291 compliant flow test calculations
- Multi-tenant organization support
- Maintenance tracking and compliance scheduling
- GIS mapping with Leaflet integration
- User authentication and role-based access control
- RESTful API with PostgreSQL database
- React frontend with Material-UI
- Deployed on Railway (backend) and Netlify (frontend)
