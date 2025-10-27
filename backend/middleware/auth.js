const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user data to req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');
      
      // Get fresh user data from database
      const result = await db.query(`
        SELECT 
          u.id,
          u.organization_id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.is_active,
          o.name as organization_name,
          o.type as organization_type
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found.' });
      }

      const user = result.rows[0];
      
      if (!user.is_active) {
        return res.status(401).json({ error: 'Account is inactive.' });
      }

      // Attach user data to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired.' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      throw jwtError;
    }

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

/**
 * Role-based Authorization Middleware
 * Restricts access based on user roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = req.user.role;
    
    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}` 
      });
    }

    next();
  };
};

/**
 * Organization Access Middleware
 * Ensures user can only access data from their organization
 */
const requireOrganizationAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Admin users can access any organization data
  if (req.user.role === 'admin') {
    return next();
  }

  // Check if organization_id is provided in query params or body
  const requestedOrgId = req.query.organization_id || req.body.organization_id;
  
  if (requestedOrgId && requestedOrgId !== req.user.organization_id) {
    return res.status(403).json({ 
      error: 'Access denied. You can only access data from your organization.' 
    });
  }

  next();
};

/**
 * Optional Authentication Middleware
 * Attaches user data if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user data
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-change-this');
      
      const result = await db.query(`
        SELECT 
          u.id,
          u.organization_id,
          u.username,
          u.email,
          u.first_name,
          u.last_name,
          u.role,
          u.is_active,
          o.name as organization_name,
          o.type as organization_type
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1 AND u.is_active = true
      `, [decoded.id]);

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }

    } catch (jwtError) {
      // Invalid token, but continue without user data
      console.log('Optional auth - invalid token:', jwtError.message);
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Resource Owner Middleware
 * Ensures user can only access/modify their own created resources
 */
const requireResourceOwner = (resourceTable, userIdField = 'user_id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admin users can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params.id;
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID is required.' });
    }

    try {
      const result = await db.query(
        `SELECT ${userIdField} FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Resource not found.' });
      }

      const resourceOwnerId = result.rows[0][userIdField];
      
      if (resourceOwnerId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only access your own resources.' 
        });
      }

      next();

    } catch (error) {
      console.error('Resource owner check error:', error);
      return res.status(500).json({ error: 'Authorization error.' });
    }
  };
};

/**
 * Rate Limiting Middleware (basic implementation)
 */
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of requests.entries()) {
      if (now - data.resetTime > windowMs) {
        requests.delete(ip);
      }
    }
    
    const userRequests = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (userRequests.count >= max) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    userRequests.count++;
    requests.set(key, userRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOrganizationAccess,
  optionalAuth,
  requireResourceOwner,
  rateLimit
};