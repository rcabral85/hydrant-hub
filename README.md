# HydrantHub 🔥💧

*Fire hydrant flow testing and management platform built by water operators for water operators*

[![GitHub Stars](https://img.shields.io/github/stars/rcabral85/hydrant-hub)](https://github.com/rcabral85/hydrant-hub/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## 🎯 What is HydrantHub?

HydrantHub eliminates the tedious spreadsheets and outdated desktop software that water utilities use for fire hydrant flow testing. Built specifically for **water operators**, **municipalities**, **fire departments**, and **testing contractors** who need NFPA 291 compliant flow testing.

### ⚡ Key Benefits
- **Save 25 minutes per test** - Reduce documentation from 30 minutes to 5 minutes
- **Ensure NFPA 291 compliance** - Automatic calculations and standardized reporting
- **Eliminate calculation errors** - Built-in formulas with real-time validation
- **Real-time collaboration** - Fire departments get instant access to hydrant data
- **Mobile-first design** - Test in the field, sync when back online

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/rcabral85/hydrant-hub.git
cd hydrant-hub
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Database Setup
```bash
# Create database and load schema
psql -U postgres -c "CREATE DATABASE hydrantdb;"
psql -U postgres -d hydrantdb -c "CREATE EXTENSION postgis;"
psql -U postgres -d hydrantdb -f database/schema.sql
```

**🎉 Visit http://localhost:3000 to see HydrantHub running locally!**

---

## 📋 Features

### ✅ Core Features (MVP)
- **Hydrant Inventory Management** - GPS coordinates, asset details, maintenance history
- **NFPA 291 Flow Testing** - Automated calculations with outlet coefficient validation
- **Interactive Mapping** - Color-coded hydrants by flow class (AA, A, B, C)
- **PDF Report Generation** - Professional reports for municipal compliance
- **User Authentication** - Role-based access for operators, supervisors, fire departments

### 🔄 In Development
- **Mobile App** - Offline-capable React Native app with QR code scanning
- **Inspection Module** - Visual inspections with photo uploads and pass/fail logic
- **Scheduling System** - Automated reminders for annual testing requirements
- **Advanced Analytics** - Water supply curve analysis and system performance metrics

### 🎯 Planned Features
- **SCADA Integration** - Real-time pressure data from water distribution systems
- **GIS Integration** - Import/export with ArcGIS, QGIS, and municipal GIS systems
- **API Integrations** - Connect with CMMS, work order systems, and fire department CAD
- **White-label Solution** - Custom branding for engineering consultants

---

## 🏗️ Technology Stack

### Backend
- **Node.js + Express.js** - RESTful API server
- **PostgreSQL + PostGIS** - Spatial database for hydrant locations
- **JWT Authentication** - Secure user sessions
- **bcrypt** - Password hashing

### Frontend
- **React 18** - Modern UI framework
- **Material-UI (MUI)** - Professional component library
- **Leaflet Maps** - Interactive mapping with custom markers
- **Chart.js** - Water supply curve visualization
- **Axios** - API client

### Mobile
- **React Native** - Cross-platform iOS/Android app
- **AsyncStorage** - Offline data persistence
- **Camera API** - Photo capture for inspections
- **GPS/Location Services** - Auto-capture coordinates

### DevOps
- **Docker** - Containerized deployments
- **GitHub Actions** - CI/CD pipeline
- **Railway** - Cloud hosting
- **Cloudflare** - CDN and security

---

## 📊 NFPA 291 Calculations

HydrantHub implements the complete NFPA 291 standard for fire hydrant flow testing:

### Outlet Flow Formula
```
Q = 29.83 × c × d² × √P

Where:
- Q = Flow rate (GPM)
- c = Outlet coefficient (0.80-0.95)
- d = Outlet diameter (inches)
- P = Pitot pressure (PSI)
```

### Available Fire Flow
```
Q_R = Q_F × (P_R/P_F)^0.54

Where:
- Q_R = Available flow at residual pressure
- Q_F = Total flow during test
- P_R = Required residual pressure (typically 20 PSI)
- P_F = Actual residual pressure during test
```

### Flow Classification (NFPA Classes)
- **Class AA**: ≥1,500 GPM @ 20 PSI residual
- **Class A**: 1,000-1,499 GPM @ 20 PSI residual
- **Class B**: 500-999 GPM @ 20 PSI residual
- **Class C**: <500 GPM @ 20 PSI residual

---

## 💼 Target Market

### Primary Users
- **Water Utilities** (30+ GTA municipalities, 400+ Ontario-wide)
- **Fire Departments** (Co-purchasing with municipalities)
- **Testing Contractors** (Trident Systems and competitors)
- **Engineering Consultants** (White-label opportunities)

### Geographic Focus
- **Phase 1**: Greater Toronto Area (GTA)
- **Phase 2**: Ontario municipalities
- **Phase 3**: Canada and northeastern United States

---

## 🛣️ Development Roadmap

### Phase 1: MVP (Weeks 1-4) ✅
- [x] Project setup and repository creation
- [x] Database schema design
- [x] NFPA 291 calculation engine
- [ ] Backend API development
- [ ] React frontend with authentication
- [ ] Basic mapping integration
- [ ] Flow testing module

### Phase 2: Core Features (Weeks 5-8)
- [ ] Inspection management
- [ ] PDF report generation
- [ ] Advanced mapping features
- [ ] Scheduling system
- [ ] Email notifications

### Phase 3: Mobile App (Weeks 9-16)
- [ ] React Native development
- [ ] Offline functionality
- [ ] QR code scanning
- [ ] Camera integration
- [ ] GPS auto-capture

### Phase 4: Enterprise Features (Weeks 17-24)
- [ ] SCADA integrations
- [ ] Advanced analytics
- [ ] White-label solution
- [ ] API marketplace

---

## 💰 Business Model

### SaaS Pricing Tiers
1. **Starter**: $49/month (100 hydrants, 2 users)
2. **Professional**: $99/month (500 hydrants, 5 users, mobile app)
3. **Enterprise**: $199/month (unlimited hydrants, white-label)

### Revenue Projections
- **Year 1**: 15 clients = $14,220 ARR
- **Year 2**: 40 clients = $47,520 ARR  
- **Year 3**: 75 clients = $107,100 ARR

*Target: $30,000 ARR by end of Year 1*

---

## 🤝 Contributing

We welcome contributions from the water utility and fire safety community!

### Ways to Contribute
1. **Report Bugs** - Use GitHub Issues for bug reports
2. **Feature Requests** - Suggest features that would help your utility
3. **Code Contributions** - Submit PRs for bug fixes or new features
4. **Documentation** - Help improve guides and API docs
5. **Testing** - Beta test new features and provide feedback

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **GitHub Issues**: [Report bugs and request features](https://github.com/rcabral85/hydrant-hub/issues)
- **Email**: support@tridentsys.ca
- **Website**: https://tridentsys.ca
- **LinkedIn**: Connect with the development team

---

## 🏆 Built By Water Operators

HydrantHub is developed by **Trident Systems**, founded by a water distribution operator with 15+ years of field experience. We understand the daily challenges of hydrant testing because we've lived them.

**Our Mission**: *Eliminate the paperwork so you can focus on keeping the water flowing and communities safe.*

---

*⭐ Star this repo if HydrantHub could help your utility!*

*🔗 Connect with us on LinkedIn and follow our development journey*