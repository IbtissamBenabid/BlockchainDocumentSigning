// Global error handling middleware for blockchain service
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    status: 500
  };

  // Hyperledger Fabric specific errors
  if (err.message && err.message.includes('fabric')) {
    error.message = 'Blockchain network error';
    error.status = 503;
  }

  if (err.message && err.message.includes('chaincode')) {
    error.message = 'Smart contract execution failed';
    error.status = 422;
  }

  if (err.message && err.message.includes('endorsement')) {
    error.message = 'Transaction endorsement failed';
    error.status = 422;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
    error.errors = Object.values(err.errors).map(e => e.message);
  }

  // Database errors
  if (err.code === '23505') { // Unique constraint violation
    error.message = 'Resource already exists';
    error.status = 409;
  }

  if (err.code === '23503') { // Foreign key constraint violation
    error.message = 'Referenced resource not found';
    error.status = 400;
  }

  if (err.code === '23502') { // Not null constraint violation
    error.message = 'Required field is missing';
    error.status = 400;
  }

  // Custom application errors
  if (err.isOperational) {
    error.message = err.message;
    error.status = err.statusCode || 500;
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
