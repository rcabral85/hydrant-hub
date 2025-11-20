const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const migrationFile = path.join(__dirname, '../../database/migrations/01_setup_unified_maintenance.sql');

// Default to local if not in env
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/hydrantdb';

async function runMigration() {
    console.log('Connecting to database...');
    console.log(`Target: ${connectionString.replace(/:[^:@]*@/, ':****@')}`); // Hide password in logs

    const client = new Client({
        connectionString: connectionString,
    });

    try {
        await client.connect();
        console.log('Connected successfully.');

        console.log(`Reading migration file: ${migrationFile}`);
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        console.log('\nTip: Ensure your database is running and the connection string in .env is correct.');
        console.log('Default used: postgresql://postgres:postgres@localhost:5432/hydrantdb');
    } finally {
        await client.end();
    }
}

runMigration();
