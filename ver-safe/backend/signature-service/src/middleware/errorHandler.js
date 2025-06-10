// Global error handling middleware for signature service
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    status: 500
  };

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'Signature file size too large';
    error.status = 413;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.status = 400;
  }

  // File type errors
  if (err.message === 'Invalid file type for signature') {
    error.message = 'Invalid file type for signature';
    error.status = 400;
  }

  // Signature-specific errors
  if (err.message && err.message.includes('signature')) {
    error.message = 'Signature processing failed';
    error.status = 422;
  }

  if (err.message && err.message.includes('certificate')) {
    error.message = 'Certificate validation failed';
    error.status = 422;
  }

  if (err.message && err.message.includes('biometric')) {
    error.message = 'Biometric verification failed';
    error.status = 422;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.errors = Object.values(err.errors).map(e => e.message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error.message = 'Signature already exists';
    error.status = 409;
  }

  if (err.code === '23503') { // Foreign key constraint violation
    error.message = 'Referenced document not found';
    error.status = 400;
  }

  if (err.code === '23502') { // Not null constraint violation
    error.message = 'Required field is missing';
    error.status = 400;
  }

  // File system errors
  if (err.code === 'ENOENT') {
    error.message = 'Signature file not found';
    error.status = 404;
  }

  if (err.code === 'EACCES') {
    error.message = 'Permission denied';
    error.status = 403;
  }

  // Custom application errors
  if (err.isOperational) {
    error.message = err.message;
    error.status = err.statusCode || 500;
  }

  // Blockchain service errors
  if (err.message && err.message.includes('blockchain')) {
    error.message = 'Blockchain service temporarily unavailable';
    error.status = 503;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Something went wrong';
  }

  res.status(error.status).json({
    success: error.success,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
