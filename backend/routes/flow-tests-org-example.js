// Org-Scoped Flow Test Query Example
router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { limit = 50, offset = 0, hydrant_id } = req.query;
    let query = `SELECT * FROM flow_tests WHERE organization_id = $1`;
    const params = [orgId];
    if (hydrant_id) { query += ' AND hydrant_id = $2'; params.push(hydrant_id); }
    query += ' ORDER BY test_date DESC LIMIT $3 OFFSET $4';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    res.json({ flow_tests: result.rows });
  } catch(err) { next(err); }
});
