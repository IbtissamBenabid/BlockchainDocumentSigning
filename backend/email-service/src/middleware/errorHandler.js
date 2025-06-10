/**
 * Global error handling middleware for the email service
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

  if (err.name === 'ConflictError' || err.message.includes('conflict')) {
    error.message = 'Resource conflict';
    return res.status(409).json(error);
  }

  if (err.name === 'RateLimitError' || err.message.includes('rate limit')) {
    error.message = 'Rate limit exceeded';
    return res.status(429).json(error);
  }

  // Email service specific errors
  if (err.message.includes('email') || err.message.includes('SMTP')) {
    error.message = 'Email service error';
    if (process.env.NODE_ENV === 'development') {
      error.details = err.message;
    }
    return res.status(503).json(error);
  }

  // Gmail API errors
  if (err.message.includes('Gmail') || err.message.includes('OAuth')) {
    error.message = 'Gmail service error';
    if (process.env.NODE_ENV === 'development') {
      error.details = err.message;
    }
    return res.status(503).json(error);
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

  // Network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET') {
    error.message = 'Network error';
    return res.status(503).json(error);
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
