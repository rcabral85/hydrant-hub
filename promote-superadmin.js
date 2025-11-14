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
