const axios = require('axios');
const { db } = require('../config/database');

const API_URL = 'http://localhost:5000/api';

async function testWorkOrderSync() {
    try {
        console.log('STEP 1: Creating test hydrant directly in database...');

        // First, get organization_id
        const orgResult = await db.query('SELECT id FROM organizations LIMIT 1');
        if (orgResult.rows.length === 0) {
            throw new Error('No organizations found');
        }
        const orgId = orgResult.rows[0].id;

        // Create test hydrant directly
        const hydrantNumber = 'TEST-' + Date.now();
        const hydrantResult = await db.query(`
      INSERT INTO hydrants (
        organization_id, hydrant_number, address, latitude, longitude,
        manufacturer, model, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id
    `, [orgId, hydrantNumber, '123 Test St', 43.6532, -79.3832, 'Mueller', 'Super Centurion', 'active']);

        const hydrantId = hydrantResult.rows[0].id;
        console.log(`   ✓ Created test hydrant #${hydrantNumber} with ID: ${hydrantId}`);

        console.log('\nSTEP 2: Logging in to API...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            identifier: 'rcabral85@gmail.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('   ✓ Login successful');

        console.log('\nSTEP 3: Creating work order via API...');
        const workOrderData = {
            hydrant_id: hydrantId,
            title: 'Test Sync Work Order',
            description: 'Testing if this syncs to the unified maintenance table',
            priority: 'HIGH',
            category: 'VALVE_REPAIR',
            department: 'Water Operations',
            estimated_cost: 150.00,
            target_completion_date: new Date(Date.now() + 86400000).toISOString()
        };

        const createRes = await axios.post(`${API_URL}/maintenance/work-orders`, workOrderData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const workOrder = createRes.data.work_order;
        console.log(`   ✓ Work Order created - ID: ${workOrder.id}, Number: ${workOrder.work_order_number}`);

        console.log('\nSTEP 4: Verifying work order in API list...');
        const listRes = await axios.get(`${API_URL}/maintenance/work-orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const foundInList = listRes.data.find(wo => wo.id === workOrder.id);

        if (foundInList) {
            console.log('   ✓ SUCCESS: Work order found in API response');
        } else {
            console.error('   ✗ FAILURE: Work order NOT found in API response');
        }

        console.log('\nSTEP 5: Verifying trigger sync to "maintenance" table...');
        const syncResult = await db.query(
            'SELECT * FROM maintenance WHERE legacy_work_order_id = $1',
            [workOrder.id]
        );

        if (syncResult.rows.length > 0) {
            console.log('   ✓ SUCCESS: Work order synced to unified maintenance table');
            console.log('     - Maintenance ID:', syncResult.rows[0].id);
            console.log('     - Title:', syncResult.rows[0].title);
            console.log('     - Type:', syncResult.rows[0].maintenance_type);
            console.log('\n🎉 ALL TESTS PASSED! Work order sync is functioning correctly.');
        } else {
            console.error('   ✗ FAILURE: Work order NOT found in unified maintenance table');
            console.error('   This indicates the trigger is missing or not functioning');
        }

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.response ? error.response.data : error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await db.end();
    }
}

testWorkOrderSync();
