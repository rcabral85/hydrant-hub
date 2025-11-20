const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:newpassword@127.0.0.1:5432/hydrantdb';

async function createTestUser() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database');

        // Create organization first
        const orgResult = await client.query(`
      INSERT INTO organizations (name, type, email, is_active)
      VALUES ('Test Organization', 'municipality', 'test@example.com', true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

        let orgId;
        if (orgResult.rows.length > 0) {
            orgId = orgResult.rows[0].id;
            console.log('Created organization with ID:', orgId);
        } else {
            // Get existing org
            const existingOrg = await client.query('SELECT id FROM organizations LIMIT 1');
            orgId = existingOrg.rows[0].id;
            console.log('Using existing organization with ID:', orgId);
        }

        // Hash password
        const passwordHash = await bcrypt.hash('password123', 10);

        // Create user
        const userResult = await client.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash,
        first_name, last_name, role, is_superadmin, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash
      RETURNING id, email, username
    `, [
            orgId,
            'rcabral',
            'rcabral85@gmail.com',
            passwordHash,
            'Rich',
            'Cabral',
            'admin',
            true,
            true
        ]);

        console.log('✅ User created/updated successfully!');
        console.log('Email:', userResult.rows[0].email);
        console.log('Username:', userResult.rows[0].username);
        console.log('Password: password123');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

createTestUser();
