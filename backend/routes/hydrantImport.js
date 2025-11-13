/**
 * Hydrant Bulk Import Routes
 * Handles CSV/Excel imports of hydrant data
 */

const express = require('express');
const router = express.Router();
const { adminOnly } = require('../middleware/roleCheck');
const pool = require('../config/database');

/**
 * POST /api/hydrants/import/preview
 * Parse and preview import data before committing
 */
router.post('/preview', adminOnly, async (req, res) => {
  try {
    const { data, filename } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    // Validate each row
    const validationResults = data.map((row, index) => {
      const errors = [];
      
      // Required fields
      if (!row.hydrant_number) {
        errors.push('Missing hydrant number');
      }
      if (!row.address) {
        errors.push('Missing address');
      }
      
      // Optional but validated fields
      if (row.latitude && (isNaN(row.latitude) || row.latitude < -90 || row.latitude > 90)) {
        errors.push('Invalid latitude');
      }
      if (row.longitude && (isNaN(row.longitude) || row.longitude < -180 || row.longitude > 180)) {
        errors.push('Invalid longitude');
      }
      
      return {
        row: index + 1,
        data: row,
        valid: errors.length === 0,
        errors,
      };
    });

    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;

    res.json({
      filename,
      totalRecords: data.length,
      validRecords: validCount,
      invalidRecords: invalidCount,
      preview: validationResults.slice(0, 10), // First 10 for preview
      canProceed: invalidCount === 0,
    });
  } catch (error) {
    console.error('Import preview error:', error);
    res.status(500).json({ error: 'Failed to preview import data' });
  }
});

/**
 * POST /api/hydrants/import/commit
 * Commit the validated import data to database
 */
router.post('/commit', adminOnly, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { data, filename } = req.body;
    const userId = req.user.id;
    const organizationId = req.user.organization_id;

    await client.query('BEGIN');

    // Create import record
    const importRecord = await client.query(
      `INSERT INTO hydrant_imports 
       (organization_id, uploaded_by_user_id, filename, total_records, status)
       VALUES ($1, $2, $3, $4, 'processing')
       RETURNING id`,
      [organizationId, userId, filename, data.length]
    );

    const importId = importRecord.rows[0].id;
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Import each hydrant
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Create location point if coordinates provided
        let locationValue = null;
        if (row.latitude && row.longitude) {
          locationValue = `ST_SetSRID(ST_MakePoint(${row.longitude}, ${row.latitude}), 4326)`;
        }

        await client.query(
          `INSERT INTO hydrants 
           (organization_id, hydrant_number, address, location, manufacturer, 
            model, year_installed, size_inches, outlet_count, nfpa_class, 
            available_flow_gpm, status)
           VALUES ($1, $2, $3, ${locationValue || 'NULL'}, $4, $5, $6, $7, $8, $9, $10, 'active')
           ON CONFLICT (organization_id, hydrant_number) DO UPDATE SET
             address = EXCLUDED.address,
             location = EXCLUDED.location,
             manufacturer = EXCLUDED.manufacturer,
             model = EXCLUDED.model,
             year_installed = EXCLUDED.year_installed,
             size_inches = EXCLUDED.size_inches,
             outlet_count = EXCLUDED.outlet_count,
             updated_at = CURRENT_TIMESTAMP`,
          [
            organizationId,
            row.hydrant_number,
            row.address,
            row.manufacturer || null,
            row.model || null,
            row.year_installed ? parseInt(row.year_installed) : null,
            row.size_inches ? parseFloat(row.size_inches) : null,
            row.outlet_count ? parseInt(row.outlet_count) : 2,
            row.nfpa_class || null,
            row.available_flow_gpm ? parseInt(row.available_flow_gpm) : null,
          ]
        );
        
        successCount++;
      } catch (err) {
        failCount++;
        errors.push({
          row: i + 1,
          hydrant_number: row.hydrant_number,
          error: err.message,
        });
      }
    }

    // Update import record
    await client.query(
      `UPDATE hydrant_imports 
       SET successful_imports = $1, failed_imports = $2, 
           status = $3, error_log = $4, completed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [successCount, failCount, failCount === 0 ? 'completed' : 'failed', 
       JSON.stringify(errors), importId]
    );

    await client.query('COMMIT');

    res.json({
      importId,
      totalRecords: data.length,
      successfulImports: successCount,
      failedImports: failCount,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Import commit error:', error);
    res.status(500).json({ error: 'Failed to import hydrants' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/hydrants/import/history
 * Get import history for the organization
 */
router.get('/history', adminOnly, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    
    const result = await pool.query(
      `SELECT hi.*, u.username, u.first_name, u.last_name
       FROM hydrant_imports hi
       LEFT JOIN users u ON hi.uploaded_by_user_id = u.id
       WHERE hi.organization_id = $1
       ORDER BY hi.created_at DESC
       LIMIT 50`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Import history error:', error);
    res.status(500).json({ error: 'Failed to fetch import history' });
  }
});

module.exports = router;
