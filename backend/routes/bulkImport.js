/**
 * Bulk Import Routes for Hydrants
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Apply authentication to all routes - MUST BE BEFORE ROUTE DEFINITIONS
router.use(authenticateToken);

/**
 * POST /api/hydrants/import/preview
 * Preview and validate CSV data before import
 */
router.post('/preview', async (req, res) => {
  try {
    const { data } = req.body;
    const organizationId = req.user.organization_id;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    let valid_count = 0;
    let error_count = 0;
    const errors = [];

    // Validate each row
    data.forEach((row, index) => {
      const rowErrors = [];

      // Required field validation
      if (!row.hydrant_number) {
        rowErrors.push('Hydrant number is required');
      }
      if (!row.address) {
        rowErrors.push('Address is required');
      }

      if (rowErrors.length > 0) {
        error_count++;
        errors.push({
          row: index + 2, // +2 because Excel starts at 1 and has header row
          message: rowErrors.join(', ')
        });
      } else {
        valid_count++;
      }
    });

    res.json({
      valid_count,
      error_count,
      total_rows: data.length,
      errors
    });

  } catch (error) {
    console.error('Bulk import preview error:', error);
    res.status(500).json({ error: 'Failed to preview import data' });
  }
});

/**
 * POST /api/hydrants/import/commit
 * Execute the bulk import after validation
 */
router.post('/commit', async (req, res) => {
  try {
    const { data, filename } = req.body;
    const organizationId = req.user.organization_id;
    const userId = req.user.id;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    let successful_rows = 0;
    let failed_rows = 0;
    const errors = [];

    // Import each valid row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Skip rows without required fields
        if (!row.hydrant_number || !row.address) {
          failed_rows++;
          errors.push({ row: i + 2, message: 'Missing required fields' });
          continue;
        }

        await db.query(
          `INSERT INTO hydrants (
            id, organization_id, hydrant_number, address,
            lat, lon, manufacturer, model, year_installed,
            size_inches, outlet_count, nfpa_class, 
            available_flow_gpm, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
          [
            uuidv4(),
            organizationId,
            row.hydrant_number,
            row.address,
            row.lat || row.latitude || null,
            row.lon || row.longitude || null,
            row.manufacturer || null,
            row.model || null,
            row.year_installed || null,
            row.size_inches || null,
            row.outlet_count || null,
            row.nfpa_class || null,
            row.available_flow_gpm || null,
            row.status || 'active'
          ]
        );
        
        successful_rows++;
      } catch (error) {
        failed_rows++;
        errors.push({ 
          row: i + 2, 
          hydrant_number: row.hydrant_number,
          message: error.message 
        });
        console.error(`Error importing row ${i + 2}:`, error);
      }
    }

    // Log the import to history
    try {
      await db.query(
        `INSERT INTO import_history (
          id, organization_id, user_id, filename, 
          total_rows, successful_rows, failed_rows, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          uuidv4(),
          organizationId,
          userId,
          filename || 'unknown',
          data.length,
          successful_rows,
          failed_rows
        ]
      );
    } catch (historyError) {
      console.warn('Failed to log import history (table may not exist):', historyError.message);
    }

    res.json({
      message: `Import complete: ${successful_rows} successful, ${failed_rows} failed`,
      successful_rows,
      failed_rows,
      total_rows: data.length,
      errors: errors.slice(0, 20) // Limit error details
    });

  } catch (error) {
    console.error('Bulk import commit error:', error);
    res.status(500).json({ error: 'Failed to commit import' });
  }
});

/**
 * GET /api/hydrants/import/history
 * Get import history for the organization
 */
router.get('/history', async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    
    const result = await db.query(
      `SELECT 
        ih.id, ih.filename, ih.total_rows, ih.successful_rows, 
        ih.failed_rows, ih.created_at, u.username
      FROM import_history ih
      LEFT JOIN users u ON ih.user_id = u.id
      WHERE ih.organization_id = $1
      ORDER BY ih.created_at DESC
      LIMIT 50`,
      [organizationId]
    );

    res.json({ imports: result.rows });
  } catch (error) {
    console.warn('Import history error (table may not exist):', error.message);
    // Return empty array if table doesn't exist yet
    res.json({ imports: [] });
  }
});

module.exports = router;
