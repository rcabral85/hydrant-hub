const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'hydrantdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,

  // Support DATABASE_URL for production deployment
  connectionString: process.env.DATABASE_URL,

  // Connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // How long a client can be idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait when connecting

  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('⚠️  Pool error on idle client (non-fatal):', err.message);
  // Don't exit - let the pool handle reconnection automatically
  // Supabase pooler often terminates idle connections, this is normal
});

// Database helper functions
const db = {
  // Query wrapper with error handling
  async query(text, params) {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Executed query:', { text: text.substring(0, 100), duration, rows: result.rowCount });
      }
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Transaction wrapper
  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a client from the pool (for complex operations)
  async getClient() {
    return await pool.connect();
  },

  // Close all connections (for graceful shutdown)
  async end() {
    await pool.end();
  },

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time, version() as postgres_version');
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        version: result.rows[0].postgres_version.split(' ')[0],
        pool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
};

// Legacy export for backwards compatibility
module.exports.query = db.query.bind(db);

// Modern exports
module.exports = { db, pool, query: db.query.bind(db) };

// Test connection on startup
if (require.main === module) {
  (async () => {
    try {
      const health = await db.healthCheck();
      console.log('Database connection test:', health);
    } catch (error) {
      console.error('Database connection failed:', error);
      process.exit(1);
    }
  })();
}
