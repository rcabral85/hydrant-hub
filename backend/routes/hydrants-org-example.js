// Org-Scoped Hydrant Query Example for HydrantHub
// Example of securely filtering hydrant queries by user's organization on every API call
// You can apply this pattern to all routes (inspections, work orders, etc)

router.get('/', async (req, res, next) => {
  try {
    // Ensure org-aware context
    const orgId = req.user.organization_id;
    const { limit = 100, offset = 0, status, nfpa_class } = req.query;

    let query = `
    SELECT * FROM hydrants WHERE organization_id = $1`;
    const params = [orgId];

    if (status) {
      query += ' AND operational_status = $2';
      params.push(status);
    }
    // ... add other filters as needed

    query += ' ORDER BY hydrant_number LIMIT $3 OFFSET $4';
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);
    res.json({ hydrants: result.rows });
  } catch (error) {
    next(error);
  }
});
