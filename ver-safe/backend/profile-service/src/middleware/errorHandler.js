/**
 * Global error handling middleware for the profile service
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.details = err.details;
    return res.status(400).json(error);
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized')) {
    error.message = 'Unauthorized access';
    return res.status(401).json(error);
  }

  if (err.name === 'ForbiddenError' || err.message.includes('forbidden')) {
    error.message = 'Access forbidden';
    return res.status(403).json(error);
  }

  if (err.name === 'NotFoundError' || err.message.includes('not found')) {
    error.message = 'Resource not found';
    return res.status(404).json(error);
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) { // PostgreSQL constraint violations
    error.message = 'Database constraint violation';
    return res.status(400).json(error);
  }

  if (err.code === 'ECONNREFUSED') {
    error.message = 'Database connection failed';
    return res.status(503).json(error);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    return res.status(413).json(error);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    return res.status(400).json(error);
  }

  // File system errors
  if (err.code === 'ENOENT') {
    error.message = 'File not found';
    return res.status(404).json(error);
  }

  if (err.code === 'EACCES') {
    error.message = 'File access denied';
    return res.status(403).json(error);
  }

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'Invalid JSON format';
    return res.status(400).json(error);
  }

  // Default server error
  if (process.env.NODE_ENV === 'development') {
    error.details = err.message;
    error.stack = err.stack;
  }

  res.status(500).json(error);
};

module.exports = errorHandler;
