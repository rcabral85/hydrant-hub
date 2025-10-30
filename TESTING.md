# 🧪 HydrantHub Testing Guide

*Complete testing instructions for the HydrantHub fire hydrant flow testing and management platform*

## 🚀 Quick Start Testing

### Prerequisites
- Node.js 18+ and npm installed
- Git installed
- Text editor (VS Code recommended)

## 🎯 Backend API Testing (Railway)

### Live API Status
**Production API**: https://hydrant-management-production.up.railway.app

### Test Endpoints
1. **Health Check**: 
   ```
   GET https://hydrant-management-production.up.railway.app/api/health
   Expected: {"status": "healthy"}
   ```

2. **List Hydrants**:
   ```
   GET https://hydrant-management-production.up.railway.app/api/hydrants
   Expected: {"success": true, "hydrants": [...], "pagination": {...}}
   ```

3. **Schema Debug**:
   ```
   GET https://hydrant-management-production.up.railway.app/api/debug/schema
   Expected: Database table structures
   ```

### Automated Testing Script
```bash
cd backend
node scripts/test-api.js
```

**Expected Output**:
```
🧪 Testing HydrantHub API...
📡 Base URL: https://hydrant-management-production.up.railway.app/api

1️⃣ Testing health endpoint...
✅ Health: { status: "healthy" }

2️⃣ Testing hydrants endpoint...
✅ Found 2 hydrants:
   - H-001: 123 Main Street, Mississauga, ON (Class A, 1200 GPM)
   - H-002: 456 Oak Avenue, Mississauga, ON (Class B, 850 GPM)

3️⃣ Creating sample flow test for H-001...
✅ Flow test created successfully!
   - Test Number: FT-2025-XXXXXX
   - Total Flow: XXX GPM
   - Available Fire Flow: XXX GPM
   - NFPA Class: A
   - NFPA 291 Compliant: true

🎉 All API tests completed successfully!
```

## 🌐 Frontend Testing

### Local Development
```bash
cd frontend
npm install
npm run dev
```

**Test URL**: http://localhost:5173/test

### Environment Configuration
Ensure `frontend/.env` contains:
```env
VITE_API_URL=https://hydrant-management-production.up.railway.app/api
```

### Frontend Test Page
The test page (`/test`) automatically:
1. ✅ Tests health endpoint
2. ✅ Lists available hydrants
3. ✅ Lists existing flow tests
4. ✅ Creates a sample NFPA 291 flow test
5. ✅ Displays results with success/error indicators

### Expected Frontend Results
- **Health Check**: Green checkmark with {"status": "healthy"}
- **Hydrants List**: Shows 2 hydrants with addresses and GPM ratings
- **Flow Tests**: Shows created tests with NFPA classifications
- **Sample Test Creation**: Creates new test with calculated NFPA 291 results

## 📊 NFPA 291 Calculations Testing

### Sample Flow Test Data
```json
{
  "static_pressure_psi": 65,
  "residual_pressure_psi": 45,
  "outlets": [
    {"size": 2.5, "pitotPressure": 42, "coefficient": 0.9},
    {"size": 2.5, "pitotPressure": 38, "coefficient": 0.9}
  ]
}
```

### Expected Calculations
- **Outlet Flow Formula**: Q = 29.83 × c × d² × √P
- **Available Fire Flow**: Q_R = Q_F × (P_R/P_F)^0.54
- **NFPA Classifications**:
  - Class AA: ≥1,500 GPM @ 20 PSI
  - Class A: 1,000-1,499 GPM @ 20 PSI
  - Class B: 500-999 GPM @ 20 PSI
  - Class C: <500 GPM @ 20 PSI

## 🗺️ Mapping Integration Testing

### GeoJSON Endpoint
```bash
curl https://hydrant-management-production.up.railway.app/api/hydrants/map/geojson
```

**Expected Response**:
```json
{
  "success": true,
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-79.6441, 43.5890]
        },
        "properties": {
          "hydrant_number": "H-001",
          "nfpa_class": "A",
          "available_flow_gpm": 1200
        }
      }
    ]
  }
}
```

## 🔐 Authentication Testing

### Default Admin User
- **Email**: admin@tridentsys.ca
- **Password**: *Needs to be set via registration*
- **Organization**: Trident Systems

### Test User Registration
```bash
curl -X POST https://hydrant-management-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tridentsys.ca",
    "password": "TestPassword123!",
    "first_name": "Test",
    "last_name": "User",
    "role": "operator"
  }'
```

## 📱 Complete App Flow Testing

### 1. Start Frontend
```bash
cd frontend
npm run dev
# Visit: http://localhost:5173/test
```

### 2. Verify API Connection
- All test cards should show green checkmarks
- Hydrant data should display with Mississauga locations
- Sample flow test should create successfully

### 3. Test Core Features
1. **Dashboard**: Navigate to `/dashboard`
2. **Hydrant Map**: Navigate to `/map`
3. **Flow Test Form**: Navigate to `/flow-test`
4. **Authentication**: Navigate to `/login`

## 🐛 Troubleshooting

### Common Issues

#### "Network Error" in Frontend
- ✅ Check `frontend/.env` has correct `VITE_API_URL`
- ✅ Verify Railway API is running: https://hydrant-management-production.up.railway.app/api/health
- ✅ Check browser console for CORS errors

#### "Column does not exist" Database Errors
- ✅ Run database migration: `node backend/scripts/railway-migration.js`
- ✅ Check schema: https://hydrant-management-production.up.railway.app/api/debug/schema
- ✅ Verify Railway database is using latest schema

#### Flow Test Calculation Errors
- ✅ Verify NFPA291Calculator service exists: `backend/services/nfpa291Calculator.js`
- ✅ Check outlet data format matches expected schema
- ✅ Ensure pitot pressure and coefficient values are realistic

### Debug Endpoints
- **Schema Check**: `/api/debug/schema`
- **Health Check**: `/api/health`
- **API Documentation**: `/api`

## ✅ Testing Checklist

### Backend (Railway)
- [ ] Health endpoint responds
- [ ] Database schema is current
- [ ] Hydrants API returns sample data
- [ ] Flow tests API accepts new tests
- [ ] NFPA 291 calculations work
- [ ] GeoJSON mapping data generates

### Frontend (Local)
- [ ] Test page loads without errors
- [ ] API connection successful
- [ ] Sample hydrants display
- [ ] Flow test creation works
- [ ] Navigation between pages works
- [ ] UI components render properly

### Integration
- [ ] Frontend connects to Railway API
- [ ] CORS configuration allows requests
- [ ] Data flows end-to-end
- [ ] Error handling works
- [ ] Loading states display

## 🎯 Success Criteria

**Your HydrantHub app is working correctly when**:
1. ✅ Railway API responds to all endpoints
2. ✅ Frontend test page shows all green checkmarks
3. ✅ Sample flow tests create with NFPA 291 calculations
4. ✅ Hydrant data displays with proper coordinates
5. ✅ No console errors in browser developer tools

## 📞 Support

If tests fail:
1. Check the troubleshooting section above
2. Review Railway deployment logs
3. Inspect browser developer console
4. Verify environment variables are set correctly

**API Base URL**: https://hydrant-management-production.up.railway.app/api  
**Test Page**: http://localhost:5173/test (when running locally)

---

*Built by water operators for water operators* 🔥💧