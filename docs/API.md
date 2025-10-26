# HydrantHub API Documentation

## Overview

HydrantHub provides a RESTful API for fire hydrant flow testing and management. All endpoints return JSON responses and follow standard HTTP status codes.

**Base URL**: `http://localhost:5000/api`

**Authentication**: JWT Bearer tokens (coming soon)

**Rate Limiting**: Not implemented (coming soon)

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details",
  "timestamp": "2025-10-26T18:30:00.000Z",
  "path": "/api/endpoint"
}
```

## Endpoints

### Health Check

#### GET /api/health
Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T18:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "responseTime": "15ms",
    "stats": {
      "organizations_count": "1",
      "users_count": "1",
      "hydrants_count": "0",
      "flow_tests_count": "0"
    }
  }
}
```

#### GET /api/health/deep
Comprehensive health check with system testing.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T18:30:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "serverTime": "2025-10-26T18:30:00.000Z"
    },
    "postgis": {
      "status": "healthy",
      "testDistance": "32m"
    },
    "calculations": {
      "status": "healthy",
      "testResults": {
        "outletFlow": "1188.38 GPM",
        "availableFlow": "2595 GPM",
        "nfpaClass": "AA"
      }
    }
  }
}
```

### Flow Tests

#### POST /api/flow-tests
Create a new NFPA 291 flow test with automatic calculations.

**Request Body:**
```json
{
  "testDate": "2025-10-26",
  "testTime": "14:30",
  "testerId": 1,
  "weatherConditions": "Clear, 15°C",
  "temperatureCelsius": 15.0,
  "testHydrantId": 1,
  "staticPressurePSI": 75.0,
  "residualPressurePSI": 55.0,
  "testHydrantLocation": {
    "lat": 43.5183,
    "lon": -79.8687
  },
  "outlets": [
    {
      "hydrantId": 2,
      "pitotPressurePSI": 45.0,
      "diameterInches": 2.5,
      "coefficientOfDischarge": 0.90
    },
    {
      "hydrantId": 3,
      "pitotPressurePSI": 42.0,
      "diameterInches": 2.5,
      "coefficientOfDischarge": 0.90
    }
  ],
  "flowHydrantLocations": [
    {
      "hydrantId": 2,
      "lat": 43.5185,
      "lon": -79.8690
    }
  ],
  "notes": "Annual flow test - all outlets functional"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "flowTest": {
    "id": 1,
    "test_date": "2025-10-26",
    "total_flow_gpm": "2130.50",
    "available_flow_20psi_gpm": "3250.75",
    "nfpa_classification": "AA"
  },
  "calculations": {
    "outletFlows": [
      {
        "hydrantId": 2,
        "pitotPressurePSI": 45,
        "diameterInches": 2.5,
        "coefficientOfDischarge": 0.9,
        "calculatedFlowGPM": 1132.19
      },
      {
        "hydrantId": 3,
        "pitotPressurePSI": 42,
        "diameterInches": 2.5,
        "coefficientOfDischarge": 0.9,
        "calculatedFlowGPM": 1094.31
      }
    ],
    "totalFlowGPM": 2226.5,
    "availableFlow20PSI": 3402.15,
    "nfpaClassification": "AA",
    "colorCode": "#0066CC",
    "waterSupplyCurve": [
      { "pressure": 0, "flow": 4890 },
      { "pressure": 5, "flow": 4654 },
      { "pressure": 10, "flow": 4418 },
      { "pressure": 15, "flow": 4182 },
      { "pressure": 20, "flow": 3946 }
    ]
  },
  "summary": {
    "totalFlowGPM": 2226.5,
    "availableFlowAt20PSI": 3402.15,
    "nfpaClassification": "AA",
    "colorCode": "#0066CC",
    "pressureDrop": 20.0
  }
}
```

#### POST /api/flow-tests/calculate
Calculate flow test results without saving (preview mode).

**Request Body:**
```json
{
  "staticPressurePSI": 75.0,
  "residualPressurePSI": 55.0,
  "outlets": [
    {
      "pitotPressurePSI": 45.0,
      "diameterInches": 2.5,
      "coefficientOfDischarge": 0.90
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "calculations": {
    "outletFlows": [
      {
        "pitotPressurePSI": 45,
        "diameterInches": 2.5,
        "coefficientOfDischarge": 0.9,
        "calculatedFlowGPM": 1132.19
      }
    ],
    "totalFlowGPM": 1132.19,
    "availableFlow20PSI": 1730.45,
    "nfpaClassification": "AA",
    "colorCode": "#0066CC"
  },
  "summary": {
    "message": "Calculations completed (preview mode - not saved)",
    "totalFlowGPM": 1132.19,
    "availableFlowAt20PSI": 1730.45,
    "nfpaClassification": "AA",
    "colorCode": "#0066CC",
    "pressureDrop": 20.0
  }
}
```

#### GET /api/flow-tests
Retrieve flow tests with pagination and filtering.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Records per page (default: 20, max: 100)
- `hydrantId` (integer): Filter by test hydrant ID
- `testerId` (integer): Filter by tester ID
- `startDate` (date): Filter tests from this date (YYYY-MM-DD)
- `endDate` (date): Filter tests to this date (YYYY-MM-DD)
- `nfpaClass` (string): Filter by NFPA classification (AA, A, B, C)

**Example:** `GET /api/flow-tests?page=1&limit=10&nfpaClass=AA&startDate=2025-01-01`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "test_date": "2025-10-26",
      "test_time": "14:30:00",
      "static_pressure_psi": "75.00",
      "residual_pressure_psi": "55.00",
      "total_flow_gpm": "2226.50",
      "available_flow_20psi_gpm": "3402.15",
      "nfpa_classification": "AA",
      "hydrant_number": "H-001",
      "hydrant_address": "123 Main St, Milton ON",
      "tester_name": "Richard Cabral"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalRecords": 1,
    "recordsPerPage": 10
  },
  "filters": {
    "nfpaClass": "AA",
    "startDate": "2025-01-01"
  }
}
```

#### GET /api/flow-tests/:id
Get detailed information for a specific flow test.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "test_date": "2025-10-26",
    "test_time": "14:30:00",
    "weather_conditions": "Clear, 15°C",
    "temperature_celsius": "15.0",
    "static_pressure_psi": "75.00",
    "residual_pressure_psi": "55.00",
    "total_flow_gpm": "2226.50",
    "available_flow_20psi_gpm": "3402.15",
    "nfpa_classification": "AA",
    "notes": "Annual flow test - all outlets functional",
    "hydrant_number": "H-001",
    "hydrant_address": "123 Main St, Milton ON",
    "hydrant_longitude": -79.8687,
    "hydrant_latitude": 43.5183,
    "tester_name": "Richard Cabral",
    "tester_certification": "WD-12345",
    "outlets": [
      {
        "id": 1,
        "outlet_diameter_inches": "2.50",
        "coefficient_discharge": "0.90",
        "pitot_pressure_psi": "45.00",
        "calculated_flow_gpm": "1132.19",
        "flow_hydrant_number": "H-002",
        "flow_hydrant_address": "125 Main St, Milton ON"
      }
    ]
  }
}
```

## NFPA 291 Calculations

The API implements the complete NFPA 291 standard for fire hydrant flow testing:

### Outlet Flow Formula
```
Q = 29.83 × c × d² × √P

Where:
- Q = Flow rate (GPM)
- c = Coefficient of discharge (0.70-0.90)
- d = Outlet diameter (inches)
- P = Pitot pressure (PSI)
```

### Available Fire Flow
```
Q_R = Q_F × ((S - 20) / (S - R))^0.54

Where:
- Q_R = Available flow at 20 PSI residual
- Q_F = Total flow measured during test
- S = Static pressure (PSI)
- R = Residual pressure during test (PSI)
```

### NFPA Classifications
- **Class AA (Blue)**: ≥1,500 GPM @ 20 PSI residual
- **Class A (Green)**: 1,000-1,499 GPM @ 20 PSI residual
- **Class B (Orange)**: 500-999 GPM @ 20 PSI residual
- **Class C (Red)**: <500 GPM @ 20 PSI residual

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation Error | Request body validation failed |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database or external service unavailable |

## Rate Limiting

*Coming soon*

- **General endpoints**: 100 requests per minute
- **Calculation endpoints**: 200 requests per minute
- **Health endpoints**: No limits

## Authentication

*Coming soon*

```http
Authorization: Bearer <jwt_token>
```

## Examples

### Calculate Flow Test (cURL)
```bash
curl -X POST http://localhost:5000/api/flow-tests/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "staticPressurePSI": 75,
    "residualPressurePSI": 55,
    "outlets": [
      {
        "pitotPressurePSI": 45,
        "diameterInches": 2.5,
        "coefficientOfDischarge": 0.90
      }
    ]
  }'
```

### Health Check (JavaScript)
```javascript
fetch('http://localhost:5000/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('API Status:', data.status);
    console.log('Database:', data.database.status);
  })
  .catch(error => console.error('Error:', error));
```

---

**Need Help?**
- GitHub Issues: [Report bugs or request features](https://github.com/rcabral85/hydrant-management/issues)
- Email: info@tridentsys.ca
- Documentation: Check the README.md for setup instructions
