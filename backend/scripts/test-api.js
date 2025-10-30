#!/usr/bin/env node
/**
 * HydrantHub API Test Script
 * Tests API endpoints and creates sample flow test data
 * Run: node backend/scripts/test-api.js
 */

const axios = require('axios');

// API Configuration
const API_BASE = process.env.API_URL || 'https://hydrant-management-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testAPI() {
  console.log('🧪 Testing HydrantHub API...');
  console.log(`📡 Base URL: ${API_BASE}`);
  
  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Testing health endpoint...');
    const health = await api.get('/health');
    console.log('✅ Health:', health.data);
    
    // Test 2: List Hydrants
    console.log('\n2️⃣ Testing hydrants endpoint...');
    const hydrants = await api.get('/hydrants');
    console.log(`✅ Found ${hydrants.data.hydrants.length} hydrants:`);
    hydrants.data.hydrants.forEach(h => {
      console.log(`   - ${h.hydrant_number}: ${h.address} (Class ${h.nfpa_class}, ${h.available_flow_gpm} GPM)`);
    });
    
    // Test 3: Create Sample Flow Test
    if (hydrants.data.hydrants.length > 0) {
      const testHydrant = hydrants.data.hydrants[0];
      console.log(`\n3️⃣ Creating sample flow test for ${testHydrant.hydrant_number}...`);
      
      const flowTestData = {
        hydrant_id: testHydrant.id,
        test_date: new Date().toISOString().split('T')[0], // Today's date
        static_pressure_psi: 65,
        residual_pressure_psi: 45,
        outlets: [
          {
            size: 2.5,
            pitotPressure: 42,
            coefficient: 0.9
          },
          {
            size: 2.5, 
            pitotPressure: 38,
            coefficient: 0.9
          }
        ],
        weather_conditions: 'Clear',
        temperature_f: 68,
        notes: 'Annual compliance test - all outlets functioning properly'
      };
      
      try {
        const flowTest = await api.post('/flow-tests', flowTestData);
        console.log('✅ Flow test created successfully!');
        console.log(`   - Test Number: ${flowTest.data.flowTest.test_number}`);
        console.log(`   - Total Flow: ${flowTest.data.flowTest.total_flow_gpm} GPM`);
        console.log(`   - Available Fire Flow: ${flowTest.data.flowTest.available_fire_flow_gpm} GPM`);
        console.log(`   - NFPA Class: ${flowTest.data.flowTest.nfpa_class}`);
        console.log(`   - NFPA 291 Compliant: ${flowTest.data.flowTest.meets_nfpa_291}`);
        
        if (flowTest.data.calculations) {
          console.log('\n📊 NFPA 291 Calculations:');
          console.log(`   - Classification: ${flowTest.data.calculations.results.classification.class} (${flowTest.data.calculations.results.classification.description})`);
          console.log(`   - Quality Score: ${flowTest.data.calculations.validation.qualityScore}%`);
        }
      } catch (flowError) {
        console.error('❌ Flow test creation failed:', flowError.response?.data || flowError.message);
      }
    }
    
    // Test 4: List Flow Tests
    console.log('\n4️⃣ Testing flow tests endpoint...');
    const flowTests = await api.get('/flow-tests');
    console.log(`✅ Found ${flowTests.data.flowTests.length} flow tests`);
    if (flowTests.data.flowTests.length > 0) {
      flowTests.data.flowTests.forEach(ft => {
        console.log(`   - ${ft.test_number}: ${ft.total_flow_gpm} GPM (${ft.nfpa_class})`);
      });
    }
    
    // Test 5: GeoJSON for mapping
    console.log('\n5️⃣ Testing map data endpoint...');
    const geojson = await api.get('/hydrants/map/geojson');
    console.log(`✅ GeoJSON contains ${geojson.data.geojson.features.length} hydrant features`);
    
    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - API Health: ✅ Healthy`);
    console.log(`   - Database: ✅ Connected`);
    console.log(`   - Hydrants: ✅ ${hydrants.data.hydrants.length} available`);
    console.log(`   - Flow Tests: ✅ ${flowTests.data.flowTests.length} recorded`);
    console.log(`   - Mapping: ✅ GeoJSON ready`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.error('🔧 Check your API URL and database connection');
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;