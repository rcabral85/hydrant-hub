module.exports = (err, req, res, next) => {
  console.error('API error:', err);
  res.status(500).json({ error: 'Internal server error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
};
