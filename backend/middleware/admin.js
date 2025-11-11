// Middleware to check for admin role
module.exports = function ensureAdmin(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const jwt = require('jsonwebtoken');
    const token = auth.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admins only' });
    }
    // Attach decoded user to request for other handlers
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
