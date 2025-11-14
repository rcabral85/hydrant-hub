/**
 * Role-Based Access Control Middleware
 * Enforces role restrictions for routes
 */

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { role, is_superadmin } = req.user;

    // Superadmins bypass all role checks
    if (is_superadmin) {
      return next();
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: allowedRoles,
        current: role,
      });
    }

    next();
  };
};

// Helper functions for common role checks
const adminOnly = roleCheck('admin');
const operatorOrAdmin = roleCheck('operator', 'admin');
const superadminOnly = (req, res, next) => {
  if (!req.user || !req.user.is_superadmin) {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

module.exports = {
  roleCheck,
  adminOnly,
  operatorOrAdmin,
  superadminOnly,
};
