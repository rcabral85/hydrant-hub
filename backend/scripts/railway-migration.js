#!/usr/bin/env node
/**
 * Railway Database Migration Script
 * Ensures the current schema is properly applied to the Railway PostgreSQL database
 * Run this after deployment to fix any schema inconsistencies
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Starting Railway database migration...');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'users', 'hydrants', 'flow_tests', 'inspections')
    `);
    
    console.log(`📊 Found ${tablesCheck.rows.length} existing tables:`, tablesCheck.rows.map(r => r.table_name));
    
    if (tablesCheck.rows.length === 0) {
      // Fresh database - run full schema
      console.log('🆕 Fresh database detected - applying full schema...');
      const schemaSQL = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema-railway.sql'), 'utf8');
      await client.query(schemaSQL);
      console.log('✅ Full schema applied successfully');
    } else {
      // Existing database - check for missing columns and apply incremental updates
      console.log('🔄 Existing database - checking for schema updates...');
      
      // Check flow_tests table structure
      const flowTestColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'flow_tests' 
        ORDER BY ordinal_position
      `);
      
      console.log('📋 Flow tests table columns:', flowTestColumns.rows.map(r => r.column_name));
      
      // Verify all required columns exist
      const requiredColumns = ['test_date', 'tested_by_user_id', 'outlets_data', 'validation_notes'];
      const existingColumns = flowTestColumns.rows.map(r => r.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns detected:', missingColumns);
        console.log('🔧 This indicates schema needs to be updated manually via Railway console');
      } else {
        console.log('✅ All required columns exist');
      }
    }
    
    // Test a simple query
    const testQuery = await client.query('SELECT COUNT(*) as hydrant_count FROM hydrants');
    console.log(`📈 Database contains ${testQuery.rows[0].hydrant_count} hydrants`);
    
    client.release();
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;