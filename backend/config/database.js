const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('🟢 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('🔴 Unexpected error on idle client:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Executed query:', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('🔴 Query error:', err);
    throw err;
  }
};

// Helper function for transactions
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('🔴 A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the release method to clear our timeout
  client.release = () => {
    clearTimeout(timeout);
    client.release = release;
    return release();
  };
  
  return { query, release: client.release };
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as server_time, version() as postgres_version');
    console.log('✅ Database connection test successful');
    console.log(`🕰️ Server time: ${result.rows[0].server_time}`);
    console.log(`🗺️ PostgreSQL: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);
    
    // Test PostGIS extension
    try {
      const postgisResult = await query('SELECT PostGIS_Version() as postgis_version');
      console.log(`🌍 PostGIS: ${postgisResult.rows[0].postgis_version}`);
    } catch (err) {
      console.warn('⚠️ PostGIS extension not found. Run: CREATE EXTENSION postgis;');
    }
    
    return true;
  } catch (err) {
    console.error('🔴 Database connection failed:', err.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection
};
