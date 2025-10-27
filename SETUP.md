# HydrantHub Setup Guide 🔥💧

## Quick Start Guide

Get HydrantHub running locally in under 10 minutes!

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 14+** with PostGIS extension
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/rcabral85/hydrant-management.git
cd hydrant-management
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
cd backend
psql -U hydrantuser -d hydrantdb -f sql/schema.sql
```

### 3. Backend Setup

```bash
cd backend
npm install

# Create environment file
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

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### Start Backend Server

```bash
npm run dev
```

Backend will be running at `http://localhost:5000`

### 4. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:3000`

### 5. First Login

The database schema creates a default admin user:

- **Username:** `admin`
- **Password:** You'll need to update the password hash in the database

**To set the admin password:**

```bash
node -e "console.log(require('bcrypt').hashSync('your_password', 12))"
```

Then update the database:

```sql
UPDATE users SET password_hash = 'your_hashed_password' WHERE username = 'admin';
```

## 🚀 Production Deployment

### Environment Variables

**Backend (.env):**
```env
# Database
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=hydrantdb
DB_USER=hydrantuser
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://user:pass@host:port/db  # Alternative to individual vars

# Security
JWT_SECRET=your_very_secure_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@yourdomain.com
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:14-3.2
    environment:
      POSTGRES_DB: hydrantdb
      POSTGRES_USER: hydrantuser
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_NAME: hydrantdb
      DB_USER: hydrantuser
      DB_PASSWORD: your_password
      JWT_SECRET: your_jwt_secret
    ports:
      - "5000:5000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Cloud Deployment Options

#### Railway (Recommended for MVP)

1. **Database:** Use Railway PostgreSQL addon
2. **Backend:** Deploy from GitHub
3. **Frontend:** Deploy to Netlify or Vercel

#### DigitalOcean

1. **Database:** Managed PostgreSQL
2. **Backend:** App Platform
3. **Frontend:** Static site hosting

#### AWS

1. **Database:** RDS PostgreSQL with PostGIS
2. **Backend:** Elastic Beanstalk or ECS
3. **Frontend:** S3 + CloudFront

## 🔧 Development Workflow

### API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Test NFPA calculator
curl -X POST http://localhost:5000/api/flow-tests/calculator/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "staticPressure": 60,
    "residualPressure": 40,
    "outlets": [
      {"size": 2.5, "pitotPressure": 45},
      {"size": 2.5, "pitotPressure": 42}
    ]
  }'
```

### Database Migrations

```bash
# Backup database
pg_dump -U hydrantuser hydrantdb > backup.sql

# Apply schema changes
psql -U hydrantuser -d hydrantdb -f sql/new_migration.sql
```

### Code Quality

```bash
# Backend linting
cd backend
npm run lint

# Frontend linting
cd frontend
npm run lint

# Run tests (when implemented)
npm test
```

## 📊 Monitoring & Maintenance

### Health Checks

- **Backend:** `GET /api/health`
- **Database:** Included in health check response
- **Authentication:** `GET /api/auth/me`

### Logs

**Development:**
```bash
# Backend logs
npm run dev

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

**Production:**
- Use PM2 for process management
- Centralized logging with Winston + ELK stack
- Error monitoring with Sentry

### Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U hydrantuser hydrantdb > /backups/hydrantdb_$DATE.sql

# Keep only last 30 days
find /backups -name "hydrantdb_*.sql" -mtime +30 -delete
```

## 🔒 Security Checklist

### Production Security

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable database SSL
- [ ] Regular security updates
- [ ] Implement proper logging
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and alerts

### Network Security

- [ ] Firewall configuration
- [ ] VPN for admin access
- [ ] Database not publicly accessible
- [ ] Regular penetration testing

## 🆘 Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check PostGIS extension
psql -U hydrantuser -d hydrantdb -c "SELECT PostGIS_Version();"
```

**CORS Errors:**
- Update `CORS_ORIGIN` in backend `.env`
- Restart backend server

**Authentication Issues:**
- Check JWT secret consistency
- Verify token expiration settings
- Clear browser localStorage

**Build Errors:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

- **GitHub Issues:** [Report bugs](https://github.com/rcabral85/hydrant-management/issues)
- **Email:** support@tridentsys.ca
- **Documentation:** [Full API docs](./README.md)

---

**Built by water operators for water operators.** 🔥💧