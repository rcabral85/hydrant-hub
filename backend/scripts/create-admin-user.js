#!/usr/bin/env node
/**
 * Create Default Admin User Script
 * Creates the default admin user for HydrantHub
 * Usage: node backend/scripts/create-admin-user.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Get database connection details
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'hydrantdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here'
};

// Use Railway DATABASE_URL if available
if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
  dbConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

const pool = new Pool(dbConfig);

async function createAdminUser() {
  console.log('🚀 Setting up default admin user...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected');
    
    // Create default organization if it doesn't exist
    const orgId = uuidv4();
    const orgResult = await client.query(`
      INSERT INTO organizations (id, name, type, contact_email, phone, address, city, province, postal_code, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id, name
    `, [
      orgId,
      'Trident Systems',
      'CONTRACTOR',
      'admin@tridentsys.ca',
      '(416) 555-0123',
      '123 Water Street',
      'Milton',
      'ON',
      'L9T 0A1',
      'Canada'
    ]);
    
    const organization = orgResult.rows[0];
    console.log(`✅ Organization ready: ${organization.name}`);
    
    // Hash the admin password
    const adminPassword = 'TridentAdmin2025!';
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const adminResult = await client.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash,
        first_name, last_name, role, phone, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO UPDATE SET 
        password_hash = $4,
        updated_at = NOW()
      RETURNING id, username, email, role
    `, [
      organization.id,
      'admin',
      'admin@tridentsys.ca',
      passwordHash,
      'Admin',
      'User',
      'admin',
      '(416) 555-0123',
      true
    ]);
    
    const adminUser = adminResult.rows[0];
    console.log('✅ Admin user created/updated:', adminUser);
    
    // Also create a test operator user
    const operatorPassword = 'TestOperator123!';
    const operatorHash = await bcrypt.hash(operatorPassword, 12);
    
    const operatorResult = await client.query(`
      INSERT INTO users (
        organization_id, username, email, password_hash,
        first_name, last_name, role, phone, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (username) DO UPDATE SET 
        password_hash = $4,
        updated_at = NOW()
      RETURNING id, username, email, role
    `, [
      organization.id,
      'operator',
      'operator@tridentsys.ca',
      operatorHash,
      'Test',
      'Operator',
      'operator',
      '(416) 555-0124',
      true
    ]);
    
    const operatorUser = operatorResult.rows[0];
    console.log('✅ Operator user created/updated:', operatorUser);
    
    client.release();
    
    console.log('\n🎉 Setup complete! You can now login with:');
    console.log('\n👤 Admin Login:');
    console.log('   Username: admin');
    console.log('   Password: TridentAdmin2025!');
    console.log('\n👤 Operator Login:');
    console.log('   Username: operator');
    console.log('   Password: TestOperator123!');
    console.log('\n🌐 Organization: Trident Systems');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    // Check if it's a table missing error
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 It looks like your database tables haven\'t been created yet.');
      console.log('   Run the database schema setup first:');
      console.log('   1. Create your database: createdb hydrantdb');
      console.log('   2. Run schema: psql -d hydrantdb -f database/schema.sql');
      console.log('   3. Then run this script again');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;