# Environment Variables Documentation

## Backend Environment Variables

Create a `backend/.env` file with the following variables:

### Database Configuration (Required)

```env
# PostgreSQL Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hydrantdb
DB_USER=hydrantuser
DB_PASSWORD=your_secure_password_here

# Optional: Use DATABASE_URL instead of individual DB vars
# DATABASE_URL=postgresql://user:password@host:port/database

# Enable SSL for cloud databases (Railway, AWS RDS, etc.)
DB_SSL=false
```

### Security (Required)

```env
# JWT Secret - MUST be at least 32 characters
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters_change_this

# JWT Token Expiration
JWT_EXPIRES_IN=24h
```

### Server Configuration (Required)

```env
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# CORS Origins (comma-separated for production)
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# For production:
# CORS_ORIGIN=https://hydranthub.tridentsys.ca,https://app.tridentsys.ca
```

### Email Configuration (Optional - Required for user invites/password reset)

```env
# SMTP Server Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@hydranthub.com

# Email Features
ENABLE_EMAIL_INVITES=false
ENABLE_PASSWORD_RESET=false
```

### Mapping Configuration (Optional)

```env
# Default Map Center (Ontario, Canada by default)
DEFAULT_MAP_CENTER_LAT=43.5182
DEFAULT_MAP_CENTER_LON=-79.8774
DEFAULT_MAP_ZOOM=12
```

### File Upload Configuration (Optional)

```env
# Maximum file upload size (in bytes)
MAX_UPLOAD_SIZE=10485760

# Upload directory
UPLOAD_DIR=./uploads
```

---

## Frontend Environment Variables

Create a `frontend/.env` file with the following variables:

### API Configuration (Required)

```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api

# For production:
# VITE_API_URL=https://hydrant-management-production.up.railway.app/api
```

### Map Configuration (Optional)

```env
# Default map center and zoom
VITE_DEFAULT_MAP_CENTER_LAT=43.5182
VITE_DEFAULT_MAP_CENTER_LON=-79.8774
VITE_DEFAULT_MAP_ZOOM=12
```

### Feature Flags (Optional)

```env
# Enable/disable features
VITE_ENABLE_MOBILE_INSPECTION=true
VITE_ENABLE_REPORTS=true
VITE_ENABLE_WORK_ORDERS=true
```

---

## Production Deployment

### Railway (Backend)

Set these environment variables in Railway dashboard:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=https://hydranthub.tridentsys.ca
PORT=5000
DB_SSL=true
```

### Netlify (Frontend)

Set these environment variables in Netlify dashboard:

```env
VITE_API_URL=https://hydrant-management-production.up.railway.app/api
VITE_DEFAULT_MAP_CENTER_LAT=43.5182
VITE_DEFAULT_MAP_CENTER_LON=-79.8774
VITE_DEFAULT_MAP_ZOOM=12
```

---

## Security Best Practices

### ⚠️ IMPORTANT

1. **Never commit `.env` files to Git**
   - They are already in `.gitignore`
   - If accidentally committed, rotate all secrets immediately

2. **Generate Strong Secrets**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate database password
   openssl rand -base64 32
   ```

3. **Use Different Secrets for Each Environment**
   - Development, staging, and production should have unique secrets
   - Never use the same JWT secret across environments

4. **Rotate Secrets Regularly**
   - JWT secrets should be rotated every 90 days
   - Database passwords should be rotated every 180 days

5. **Environment Variable Management**
   - Use a secrets manager for production (AWS Secrets Manager, HashiCorp Vault)
   - Document all required variables in this file
   - Validate all required variables on application startup

---

## Validation Script

Create a `backend/scripts/validate-env.js` script to check all required variables:

```javascript
const requiredVars = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
  'JWT_SECRET', 'CORS_ORIGIN'
];

const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

console.log('All required environment variables are set');
```

---

## Troubleshooting

### Database Connection Issues

- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` are correct
- For Railway: Use `DATABASE_URL` instead of individual variables
- Check if database has PostGIS extension enabled

### CORS Errors

- Ensure `CORS_ORIGIN` includes your frontend URL
- Multiple origins must be comma-separated
- Include both www and non-www versions if applicable

### JWT Authentication Issues

- Verify `JWT_SECRET` is the same across all backend instances
- Check token expiration time in `JWT_EXPIRES_IN`
- Clear browser localStorage and cookies if tokens are cached

---

**Built by water operators for water operators** 🔥💧
