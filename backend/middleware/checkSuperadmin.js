// Backend Middleware - Superadmin Role Check
// File: backend/middleware/checkSuperadmin.js

const checkSuperadmin = (req, res, next) => {
  // Assumes user is already authenticated and attached to req.user by your existing auth middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check the is_superadmin boolean flag (not role)
  if (req.user.is_superadmin !== true) {
    return res.status(403).json({
      error: 'Access denied. Superadmin privileges required.'
    });
  }

  next();
};

module.exports = checkSuperadmin;
