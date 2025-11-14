# HydrantHub Setup Guide 🔥💧

## Quick Start Guide

Get HydrantHub running locally in under 10 minutes!

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 14+** with PostGIS extension
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/rcabral85/hydrant-hub.git
cd hydrant-hub
```

### 2. Database Setup

#### Install PostgreSQL and PostGIS

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis postgresql-14-postgis-3
```

**macOS (using Homebrew):**
```bash
brew install postgresql postgis
brew services start postgresql
```

**Windows:**
- Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
- Install PostGIS from [postgis.net](https://postgis.net/windows_downloads/)

#### Create Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE hydrantdb;
CREATE USER hydrantuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE hydrantdb TO hydrantuser;

# Enable PostGIS extension
\c hydrantdb;
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";

# Exit PostgreSQL
\q
```

#### Load Database Schema

```bash
# From project root
psql -U hydrantuser -d hydrantdb -f database/schema.sql

# Optional: Apply any migrations
psql -U hydrantuser -d hydrantdb -f database/migrations/001_add_missing_columns.sql
psql -U hydrantuser -d hydrantdb -f database/migrations/002_enhance_rbac.sql
```

### 3. Backend Setup

```bash
cd backend
npm install

# Create environment file from example
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Required .env configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hydrantdb
DB_USER=hydrantuser
DB_PASSWORD=your_secure_password

JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_change_this
JWT_EXPIRES_IN=24h

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for complete documentation.

#### Start Backend Server

```bash
npm run dev
```

Backend will be running at `http://localhost:5000`

Verify it's working: `curl http://localhost:5000/api/health`

### 4. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:5173`

### 5. Create First Account & Promote to Superadmin

1. **Register an account:**
   - Navigate to `http://localhost:5173/register`
   - Complete organization signup
   - Create your admin account
   - Login with your credentials

2. **Promote to superadmin:**
   ```bash
   # From project root
   node promote-superadmin.js your_email@example.com
   ```

3. **Verify superadmin access:**
   - Logout and login again
   - You should now see "Admin" in the navigation menu
   - Navigate to `/admin` to access admin panel

---

## 🚀 Production Deployment

### Railway Backend Deployment

1. **Create new Railway project**
2. **Add PostgreSQL database**
3. **Deploy from GitHub:**
   - Connect your `hydrant-hub` repository
   - Set root directory to `backend`
   - Railway will auto-detect Node.js

4. **Configure environment variables:**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=<generate-secure-32-char-secret>
   JWT_EXPIRES_IN=24h
   NODE_ENV=production
   CORS_ORIGIN=https://hydranthub.tridentsys.ca
   PORT=5000
   DB_SSL=true
   ```

5. **Run database schema:**
   - Connect to Railway PostgreSQL via CLI
   - Run: `psql $DATABASE_URL -f database/schema.sql`

### Netlify Frontend Deployment

1. **Create new Netlify site**
2. **Connect GitHub repository**
3. **Configure build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

4. **Set environment variables:**
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   ```

5. **Custom domain:**
   - Add `hydranthub.tridentsys.ca`
   - Configure DNS records
   - Enable HTTPS (automatic with Netlify)

### Post-Deployment

1. **Update CORS on backend** to include production frontend URL
2. **Run database migrations** on production database
3. **Create your production superadmin account**
4. **Test complete user flow** (see PRE_LAUNCH_CHECKLIST.md)
5. **Set up monitoring** and error tracking

---

## 🔧 Development Workflow

### API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your_email@example.com","password":"your_password"}'

# Get dashboard metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/metrics
```

### Database Migrations

```bash
# Backup database
pg_dump -U hydrantuser hydrantdb > backup_$(date +%Y%m%d).sql

# Apply migration
psql -U hydrantuser -d hydrantdb -f database/migrations/new_migration.sql

# Verify migration
psql -U hydrantuser -d hydrantdb -c "\d+ users"
```

### Code Quality

```bash
# Backend linting
cd backend && npm run lint

# Frontend linting
cd frontend && npm run lint

# Fix linting issues automatically
npm run lint -- --fix
```

---

## 📊 Monitoring & Maintenance

### Health Checks

- **Backend API:** `GET /api/health`
- **Database connectivity:** Included in health response
- **Authentication:** `GET /api/auth/me`

### Logs

**Development:**
```bash
# View backend logs
npm run dev

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Production (Railway):**
- View logs in Railway dashboard
- Set up log drains for centralized logging

### Backup Strategy

```bash
# Automated daily backups (add to cron)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hydrantuser hydrantdb > /backups/hydrantdb_$DATE.sql
find /backups -name "hydrantdb_*.sql" -mtime +30 -delete
```

---

## 🔒 Security Checklist

### Before Launch

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Remove `.env` from Git tracking
- [ ] Enable database SSL for production
- [ ] Set up rate limiting (if needed)
- [ ] Implement proper error logging
- [ ] Configure firewall rules
- [ ] Set up automated backups

---

## 🆘 Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostGIS extension
psql -U hydrantuser -d hydrantdb -c "SELECT PostGIS_Version();"

# Test connection
psql -U hydrantuser -d hydrantdb
```

### CORS Errors

- Update `CORS_ORIGIN` in backend `.env`
- Ensure frontend URL is included
- Restart backend server: `npm run dev`

### Authentication Issues

- Verify JWT secret matches across all backend instances
- Check token expiration: default is 24h
- Clear browser localStorage: `localStorage.clear()`
- Verify user exists and is active in database

### Build Errors

```bash
# Clear caches and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Port Already in Use

```bash
# Find and kill process using port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in backend/.env
```

---

## 📚 Additional Resources

- **API Documentation:** See [README.md](./README.md)
- **Pre-Launch Checklist:** [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md)
- **Environment Variables:** [ENV_VARIABLES.md](./ENV_VARIABLES.md)
- **Testing Guide:** [TESTING.md](./TESTING.md)
- **GitHub Repository:** [github.com/rcabral85/hydrant-hub](https://github.com/rcabral85/hydrant-hub)

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/rcabral85/hydrant-hub/issues)
- **Email:** rcabral85@gmail.com
- **Website:** [tridentsys.ca](https://tridentsys.ca)

---

**Built by water operators for water operators.** 🔥💧
