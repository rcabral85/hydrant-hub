const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()), credentials: true }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Routes
app.use('/api/auth', require('./routes/auth')(pool));
app.use('/api/hydrants', require('./routes/hydrants')(pool));
app.use('/api/tests', require('./routes/flowtests')(pool));

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, version: 'mvp-1' }); }
  catch (e) { res.status(500).json({ ok: false }); }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`HydrantHub API listening on :${port}`));
