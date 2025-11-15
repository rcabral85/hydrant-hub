require('dotenv').config();
const { Pool } = require('pg');

// Uses your DATABASE_URL from Railway
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not found in environment variables.');
  console.error('Make sure you have a .env file in the root with DATABASE_URL set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function promoteSuperadmin() {
  try {
    // 1. Drop the old constraint if it exists
    await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
    console.log('✓ Dropped old constraint');
    
    // 2. Add new constraint with superadmin
    await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'viewer', 'superadmin'));");
    console.log('✓ Added new constraint with superadmin role');
    
    // 3. Promote the admin user
    const result = await pool.query("UPDATE users SET role = 'superadmin' WHERE username = 'admin';");
    console.log(`✓ Updated ${result.rowCount} user(s) to superadmin`);
    
    console.log('\n✅ SUCCESS! Admin user promoted to superadmin!');
  } catch (err) {
    console.error('❌ Error running migration:', err.message);
  } finally {
    await pool.end();
  }
}

promoteSuperadmin();
