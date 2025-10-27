# Railway Deployment Fixes

## Issues Resolved

This document outlines the fixes applied to resolve Railway deployment issues for the HydrantHub API.

### 1. PostGIS Extension Issue

**Problem**: Railway PostgreSQL doesn't have PostGIS extension available
```
2025-10-27 141145.181 UTC 999 ERROR extension postgis is not available
2025-10-27 141145.181 UTC 999 DETAIL Could not open extension control file /usr/share/postgresql/17/extension/postgis.control: No such file or directory.
```

**Solution**: Created `schema-railway.sql` that uses standard PostgreSQL features:
- Replaced `GEOMETRY(POINT, 4326)` with separate `lat DECIMAL(10,8)` and `lon DECIMAL(11,8)` columns
- Removed `CREATE EXTENSION IF NOT EXISTS postgis;` 
- Added spatial index using standard B-tree: `CREATE INDEX idx_hydrants_lat_lon ON hydrants(lat, lon);`
- Updated sample data to use decimal coordinates instead of `ST_SetSRID(ST_MakePoint(...))`

### 2. Server.js Configuration Issues

**Problem**: Incomplete server configuration causing startup failures

**Solution**: Updated `backend/server.js` with:
- Complete Express middleware setup
- Proper error handling
- CORS configuration
- Graceful shutdown handling
- Database connection testing on startup
- Comprehensive logging

### 3. Database Initialization

**Problem**: No automatic database setup for Railway deployment

**Solution**: Created initialization scripts:
- `backend/scripts/init-db.js` - Standalone database initialization
- `backend/scripts/migrate.js` - Updated migration with PostGIS -> lat/lon conversion
- Updated `package.json` to run initialization before server start

### 4. Package.json Scripts

**Problem**: Missing Railway-specific deployment commands

**Solution**: Added new scripts:
```json
{
  "start": "node scripts/init-db.js && node server.js",
  "db:init": "node scripts/init-db.js",
  "db:railway": "psql -f sql/schema-railway.sql",
  "railway:start": "node scripts/init-db.js && node server.js"
}
```

## Files Added/Modified

### New Files
- `backend/sql/schema-railway.sql` - PostGIS-free schema for Railway
- `backend/scripts/init-db.js` - Database initialization script
- `RAILWAY_FIXES.md` - This documentation

### Modified Files
- `backend/server.js` - Complete server configuration
- `backend/package.json` - Added Railway deployment scripts  
- `backend/scripts/migrate.js` - PostGIS to lat/lon migration support

## Deployment Process

### Railway Environment Variables Required
```bash
DATABASE_URL=postgresql://...
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your-jwt-secret
ADMIN_SCHEMA_SECRET=your-admin-secret
PORT=5000
```

### Deployment Steps
1. Railway will automatically run `npm start` which:
   - Runs `node scripts/init-db.js` to initialize/migrate database
   - Starts the server with `node server.js`

2. The init script will:
   - Test database connectivity
   - Apply Railway-compatible schema if fresh database
   - Migrate PostGIS data to lat/lon if upgrading
   - Create necessary indexes
   - Insert sample data

### Testing the Fix

After deployment, test these endpoints:
- `GET /` - API information
- `GET /api/health` - Database connectivity and health
- `GET /api/hydrants` - Sample hydrant data

## Schema Differences

| PostGIS Version | Railway Version |
|---|---|
| `location GEOMETRY(POINT, 4326)` | `lat DECIMAL(10,8), lon DECIMAL(11,8)` |
| `ST_SetSRID(ST_MakePoint(-79.6441, 43.5890), 4326)` | `lat: 43.5890, lon: -79.6441` |
| `CREATE INDEX ... USING GIST (location)` | `CREATE INDEX ... (lat, lon)` |

## API Compatibility

The API remains fully compatible - location queries will work with lat/lon coordinates:

```javascript
// PostGIS query (old)
SELECT * FROM hydrants 
WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)

// Decimal coordinate query (new)
SELECT * FROM hydrants 
WHERE 
  lat BETWEEN $2 - $3 AND $2 + $3 AND 
  lon BETWEEN $1 - $3 AND $1 + $3
```

## Future Enhancements

1. **PostGIS Migration**: If Railway adds PostGIS support, run migration script to convert back
2. **Spatial Queries**: Implement haversine distance calculations for radius searches
3. **GeoJSON Support**: Add GeoJSON output format for mapping applications

## Troubleshooting

If deployment still fails:

1. **Check logs**: `railway logs`
2. **Verify DATABASE_URL**: Ensure PostgreSQL connection string is correct
3. **Test locally**: Run `npm run db:init` locally first
4. **Check permissions**: Ensure database user has CREATE permissions

For support: info@tridentsys.ca
