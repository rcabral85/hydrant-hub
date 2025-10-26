const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    status: err.statusCode || 500,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.status = 409;
        error.message = 'Resource already exists';
        error.details = 'A record with this information already exists';
        break;
      case '23503': // Foreign key violation
        error.status = 400;
        error.message = 'Invalid reference';
        error.details = 'Referenced record does not exist';
        break;
      case '23502': // Not null violation
        error.status = 400;
        error.message = 'Required field missing';
        error.details = 'A required field was not provided';
        break;
      case '42P01': // Undefined table
        error.status = 500;
        error.message = 'Database configuration error';
        error.details = 'Database table not found';
        break;
      default:
        error.status = 500;
        error.message = 'Database error';
        error.details = process.env.NODE_ENV === 'development' ? err.message : 'An error occurred';
    }
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    error.status = 400;
    error.message = 'Validation error';
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
    error.details = 'Authentication token is invalid';
  }

  if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.message = 'Token expired';
    error.details = 'Authentication token has expired';
  }

  // Don't leak stack trace in production
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }

  res.status(error.status).json({
    error: error.message,
    details: error.details,
    timestamp: error.timestamp,
    path: error.path,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;
