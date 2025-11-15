<<<<<<< HEAD
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
=======
#!/usr/bin/env node

/**
 * Superadmin Promotion Script
 * 
 * Usage: node promote-superadmin.js <email>
 * Example: node promote-superadmin.js rcabral85@gmail.com
 */

const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function promoteSuperadmin(email) {
  const client = await pool.connect();
  
  try {
    console.log(`Looking for user with email: ${email}`);
    
    const userResult = await client.query(
      'SELECT id, username, email, first_name, last_name, role, is_superadmin FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.error('Error: User not found with email:', email);
      console.log('\nAvailable users:');
      const allUsers = await client.query('SELECT id, email, username FROM users ORDER BY id');
      allUsers.rows.forEach(u => console.log(`  - ${u.email} (${u.username})`));
      return false;
    }
    
    const user = userResult.rows[0];
    
    if (user.is_superadmin) {
      console.log('User is already a superadmin:');
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      return true;
    }
    
    await client.query(
      'UPDATE users SET is_superadmin = true, role = \'admin\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    console.log('Successfully promoted user to superadmin!');
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Previous Role: ${user.role}`);
    console.log('   New Role: admin (superadmin)');
    
    return true;
    
  } catch (error) {
    console.error('Error promoting superadmin:', error.message);
    return false;
  } finally {
    client.release();
  }
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node promote-superadmin.js <email>');
  console.log('Example: node promote-superadmin.js rcabral85@gmail.com');
  process.exit(1);
}

const email = args[0];

promoteSuperadmin(email)
  .then(success => {
    pool.end();
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    pool.end();
    process.exit(1);
  });
>>>>>>> origin/main
