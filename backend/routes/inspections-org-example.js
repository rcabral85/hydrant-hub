// Org-Scoped Inspection Query Example
router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { limit = 50, offset = 0, type } = req.query;
    let query = `SELECT * FROM maintenance_inspections WHERE organization_id = $1`;
    const params = [orgId];
    if (type) { query += ' AND inspection_type_id = $2'; params.push(type); }
    query += ' ORDER BY inspection_date DESC LIMIT $3 OFFSET $4';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    res.json({ inspections: result.rows });
  } catch(err) { next(err); }
});
