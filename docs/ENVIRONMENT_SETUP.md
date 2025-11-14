# Environment Setup Guide

## Quick Start

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Generate secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. Edit `.env` with your values:
   ```bash
   nano .env  # or your preferred editor
   ```

5. Required variables:
   - `DATABASE_URL` or `DB_*` settings
   - `JWT_SECRET` (use generated value from step 3)
   - `CORS_ORIGIN` (your frontend URLs)

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:
   ```bash
   nano .env
   ```

4. Set your API URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## Development Environment

### Local PostgreSQL Setup

```bash
# Install PostgreSQL and PostGIS
# See SETUP.md for OS-specific instructions

# Create database
psql -U postgres
CREATE DATABASE hydrantdb;
CREATE USER hydrantuser WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE hydrantdb TO hydrantuser;

# Enable extensions
\c hydrantdb
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";
\q
```

### Backend `.env` for Local Development

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hydrantdb
DB_USER=hydrantuser
DB_PASSWORD=dev_password

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

JWT_SECRET=<paste your generated secret here>
JWT_EXPIRES_IN=24h

LOG_LEVEL=debug
```

### Frontend `.env` for Local Development

```env
VITE_API_URL=http://localhost:5000/api
VITE_ENABLE_DEBUG=true
```

## Production Environment

### Railway Backend

1. In Railway dashboard, go to your backend service
2. Navigate to "Variables" tab
3. Add each variable:

```env
DATABASE_URL=<Railway provides this automatically>
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://hydranthub.tridentsys.ca,https://app.tridentsys.ca
JWT_SECRET=<your production secret - DIFFERENT from dev>
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
```

### Netlify Frontend

1. In Netlify dashboard, go to Site settings > Environment variables
2. Add:

```env
VITE_API_URL=https://hydrant-management-production.up.railway.app/api
VITE_ENABLE_DEBUG=false
```

## Email Service Setup

### Option 1: Gmail (Development)

1. Enable 2FA on Google account
2. Generate App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "HydrantHub Dev"
   - Copy the 16-character password

3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=noreply@tridentsys.ca
   ```

### Option 2: SendGrid (Production Recommended)

1. Create SendGrid account
2. Create API key with "Mail Send" permission
3. Add to Railway environment:
   ```env
   SENDGRID_API_KEY=SG.xxxxx
   SMTP_FROM=noreply@tridentsys.ca
   ```

### Option 3: Mailgun

1. Create Mailgun account
2. Verify domain
3. Get API key and domain
4. Add to environment:
   ```env
   MAILGUN_API_KEY=key-xxxxx
   MAILGUN_DOMAIN=mg.yourdomain.com
   SMTP_FROM=noreply@tridentsys.ca
   ```

## Environment Variables Reference

### Backend Required

| Variable | Description | Example |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret for JWT tokens | 64+ char random string |
| `CORS_ORIGIN` | Allowed frontend domains | `https://app.example.com` |
| `NODE_ENV` | Environment mode | `production` or `development` |

### Backend Optional

| Variable | Description | Default |
|----------|-------------|----------|
| `PORT` | Server port | `5000` |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `LOG_LEVEL` | Logging verbosity | `info` |
| `MAX_FILE_SIZE` | Upload limit | `10mb` |
| `SMTP_HOST` | Email server | - |
| `SMTP_PORT` | Email port | `587` |
| `SMTP_USER` | Email username | - |
| `SMTP_PASS` | Email password | - |
| `SMTP_FROM` | Sender address | - |

### Frontend Required

| Variable | Description | Example |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | `https://api.example.com/api` |

### Frontend Optional

| Variable | Description | Default |
|----------|-------------|----------|
| `VITE_APP_NAME` | Application name | `HydrantHub` |
| `VITE_ENABLE_DEBUG` | Debug mode | `false` |
| `VITE_MAPBOX_TOKEN` | Mapbox API key | - |

## Troubleshooting

### Database Connection Failed

```bash
# Test connection
psql -h localhost -U hydrantuser -d hydrantdb

# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS
```

### CORS Errors

1. Verify `CORS_ORIGIN` includes your frontend URL
2. Check protocol (http vs https)
3. Check port numbers
4. Restart backend after changes

### JWT Token Issues

1. Ensure `JWT_SECRET` is set
2. Verify secret is same in all backend instances
3. Check token hasn't expired
4. Clear browser localStorage

### Email Not Sending

1. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```
2. Verify app password (not account password)
3. Check firewall rules
4. Review logs for specific error

## Security Reminders

- ✅ Never commit `.env` files
- ✅ Use different secrets for dev/prod
- ✅ Rotate credentials every 90 days
- ✅ Use app-specific passwords for email
- ✅ Limit CORS to specific domains
- ✅ Review logs regularly

## Next Steps

After environment setup:

1. Run database migrations: See `database/migrations/`
2. Create admin user: See `SETUP.md`
3. Test API: See `TESTING.md`
4. Deploy: See `README.md`
