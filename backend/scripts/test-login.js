const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:newpassword@127.0.0.1:5432/hydrantdb';

async function testLogin() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database\n');

        // Get user
        const result = await client.query(`
      SELECT id, email, username, password_hash, is_active
      FROM users
      WHERE email = 'rcabral85@gmail.com'
    `);

        if (result.rows.length === 0) {
            console.log('❌ User not found!');
            return;
        }

        const user = result.rows[0];
        console.log('User found:');
        console.log('  ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Username:', user.username);
        console.log('  Is Active:', user.is_active);
        console.log('  Password Hash:', user.password_hash.substring(0, 20) + '...');
        console.log();

        // Test password
        const testPassword = 'password123';
        console.log('Testing password:', testPassword);

        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

testLogin();
