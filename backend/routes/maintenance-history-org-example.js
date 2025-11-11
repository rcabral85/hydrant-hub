// Org-Scoped Maintenance History Query Example
router.get('/:hydrantId/history', async (req, res, next) => {
  try {
    const orgId = req.user.organization_id;
    const { hydrantId } = req.params;
    let query = `SELECT * FROM maintenance_history WHERE hydrant_id = $1 AND organization_id = $2 ORDER BY action_date DESC`;
    const params = [hydrantId, orgId];
    const result = await db.query(query, params);
    res.json({ history: result.rows });
  } catch(err) { next(err); }
});