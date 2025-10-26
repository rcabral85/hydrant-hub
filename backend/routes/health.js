const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

router.get('/', (req, res) => res.json({ status: 'healthy' }));

router.get('/deep', async (req, res, next) => {
  try {
    const result = await query('SELECT NOW() as now');
    res.json({ status: 'healthy', db: 'connected', now: result.rows[0].now });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
