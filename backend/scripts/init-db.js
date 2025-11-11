#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');

/**
 * Initialize database with Railway-compatible schema
 * This script runs the schema-railway.sql file which doesn't use PostGIS
 * Modified to be idempotent - safe to run multiple times
 */
async function initializeDatabase() {
  console.log('📦 Initializing HydrantHub Database...');
  
  try {
    // Check if database is connected
    console.log('🔍 Testing database connection...');
    const health = await db.healthCheck();
    
    if (health.status !== 'healthy') {
      throw new Error(`Database is not healthy: ${health.error}`);
    }
    
    console.log(`✅ Database connected: ${health.version}`);
    
    // Check if tables already exist
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'hydrants', 'flow_tests', 'inspections')
      ORDER BY table_name;
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    if (existingTables.length > 0) {
      console.log('📋 Database already initialized with tables:', existingTables.join(', '));
      
      // Check if sample data exists
      const orgCount = await db.query('SELECT COUNT(*) FROM organizations');
      const userCount = await db.query('SELECT COUNT(*) FROM users');
      const hydrantCount = await db.query('SELECT COUNT(*) FROM hydrants');
      
      console.log('📈 Current data status:');
      console.log(`  - Organizations: ${orgCount.rows[0].count}`);
      console.log(`  - Users: ${userCount.rows[0].count}`);
      console.log(`  - Hydrants: ${hydrantCount.rows[0].count}`);
      
      console.log('✅ Database initialization skipped - already initialized');
      return;
    }
    
    // Tables don't exist, run the schema
    console.log('🆕 Fresh database detected - running schema initialization...');
    
    // Read the Railway-compatible schema
    const schemaPath = path.join(__dirname, '../sql/schema-railway.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');
    
    // Execute the schema
    console.log('🚀 Running database schema...');
    await db.query(schemaSql);
    
    console.log('✅ Database schema applied successfully');
    
    // Verify tables were created
    const newTablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    newTablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if sample data was inserted
    const orgCount = await db.query('SELECT COUNT(*) FROM organizations');
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    const hydrantCount = await db.query('SELECT COUNT(*) FROM hydrants');
    
    console.log('📈 Sample data inserted:');
    console.log(`  - Organizations: ${orgCount.rows[0].count}`);
    console.log(`  - Users: ${userCount.rows[0].count}`);
    console.log(`  - Hydrants: ${hydrantCount.rows[0].count}`);
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
