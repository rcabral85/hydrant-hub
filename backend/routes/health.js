const express = require('express');
const { testConnection, query } = require('../config/database');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbHealthy = await testConnection();
    const dbResponseTime = Date.now() - startTime;
    
    // Get basic database stats
    let dbStats = null;
    if (dbHealthy) {
      try {
        const statsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM organizations) as organizations_count,
            (SELECT COUNT(*) FROM users) as users_count,
            (SELECT COUNT(*) FROM hydrants) as hydrants_count,
            (SELECT COUNT(*) FROM flow_tests) as flow_tests_count
        `;
        const result = await query(statsQuery);
        dbStats = result.rows[0];
      } catch (err) {
        console.warn('Could not fetch database stats (tables may not exist yet)');
        dbStats = { note: 'Database tables not yet created' };
      }
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: require('../package.json').version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        responseTime: `${dbResponseTime}ms`,
        stats: dbStats
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        unit: 'MB'
      },
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      }
    };
    
    // Return 503 if database is not healthy
    const statusCode = dbHealthy ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/deep
 * @desc    Deep health check with more thorough database testing
 * @access  Public
 */
router.get('/deep', async (req, res) => {
  try {
    const checks = {
      database: { status: 'checking' },
      calculations: { status: 'checking' },
      postgis: { status: 'checking' }
    };
    
    // Test database connection and basic queries
    try {
      await testConnection();
      const timeCheck = await query('SELECT NOW() as current_time');
      checks.database = {
        status: 'healthy',
        serverTime: timeCheck.rows[0].current_time
      };
    } catch (err) {
      checks.database = {
        status: 'unhealthy',
        error: err.message
      };
    }
    
    // Test PostGIS functionality
    try {
      const postgisCheck = await query(`
        SELECT 
          ST_Distance(
            ST_GeogFromText('POINT(-79.8687 43.5183)'),  -- Milton, ON
            ST_GeogFromText('POINT(-79.8690 43.5185)')   -- Nearby point
          ) as distance_meters
      `);
      checks.postgis = {
        status: 'healthy',
        testDistance: `${Math.round(postgisCheck.rows[0].distance_meters)}m`
      };
    } catch (err) {
      checks.postgis = {
        status: 'unhealthy',
        error: err.message
      };
    }
    
    // Test calculation engine
    try {
      const calculations = require('../services/calculations');
      const testFlow = calculations.calculateOutletFlow(50, 2.5, 0.90);
      const testAvailable = calculations.calculateAvailableFireFlow(1500, 80, 60, 20);
      const testClassification = calculations.classifyHydrantNFPA(testAvailable);
      
      checks.calculations = {
        status: 'healthy',
        testResults: {
          outletFlow: `${testFlow} GPM`,
          availableFlow: `${testAvailable} GPM`,
          nfpaClass: testClassification
        }
      };
    } catch (err) {
      checks.calculations = {
        status: 'unhealthy',
        error: err.message
      };
    }
    
    // Overall health
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
