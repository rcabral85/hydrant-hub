// Org-Scoped Work Order Query Example
router.get('/', async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { limit = 50, offset = 0, status } = req.query;
    let query = `SELECT * FROM repair_work_orders WHERE organization_id = $1`;
    const params = [orgId];
    if (status) { query += ' AND status = $2'; params.push(status); }
    query += ' ORDER BY scheduled_date DESC LIMIT $3 OFFSET $4';
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    res.json({ work_orders: result.rows });
  } catch(err) { next(err); }
});
