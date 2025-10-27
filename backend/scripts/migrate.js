const { db } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Run database migrations for Railway deployment
 * This will apply the Railway-compatible schema without PostGIS
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Test database connection
    const health = await db.healthCheck();
    if (health.status !== 'healthy') {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection verified');

    // Check if we're starting fresh or migrating
    let tablesExist = false;
    try {
      const result = await db.query(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hydrants'"
      );
      tablesExist = parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.log('📄 Fresh database detected');
    }

    if (tablesExist) {
      console.log('📋 Tables already exist, running incremental migrations...');
      
      // Check if location column exists and migrate from PostGIS to lat/lon if needed
      try {
        await db.query('SELECT location FROM hydrants LIMIT 1');
        console.log('🔄 Found PostGIS location column, migrating to lat/lon...');
        
        // Add lat/lon columns if they don't exist
        await db.query(`
          ALTER TABLE hydrants 
          ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8),
          ADD COLUMN IF NOT EXISTS lon DECIMAL(11, 8)
        `);
        
        // Migrate existing PostGIS data to lat/lon (if any exists)
        await db.query(`
          UPDATE hydrants 
          SET lat = ST_Y(location), lon = ST_X(location) 
          WHERE location IS NOT NULL AND (lat IS NULL OR lon IS NULL)
        `);
        
        console.log('✅ PostGIS to lat/lon migration completed');
      } catch (error) {
        console.log('📅 No PostGIS location column found, proceeding...');
      }
    } else {
      console.log('📦 Initializing fresh database with Railway schema...');
      
      // Read and execute the Railway-compatible schema
      const schemaPath = path.join(__dirname, '../sql/schema-railway.sql');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Railway schema file not found: ${schemaPath}`);
      }
      
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schemaSql);
      
      console.log('✅ Railway schema applied successfully');
    }

    // Ensure all required indexes exist
    console.log('🔍 Checking indexes...');
    await db.query('CREATE INDEX IF NOT EXISTS idx_hydrants_lat_lon ON hydrants(lat, lon)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_hydrants_org_id ON hydrants(organization_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_hydrants_status ON hydrants(status)');
    
    console.log('✅ Indexes verified');

    // Final verification
    const finalCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Final table count:', finalCheck.rows.length);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed, exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
