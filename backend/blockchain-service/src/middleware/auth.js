/**
 * Middleware for API key authentication (for inter-service communication)
 */
function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required'
    });
  }

  // In production, this should verify against a database
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  req.service = {
    name: 'internal-service',
    permissions: { all: true }
  };

  next();
}

module.exports = {
  authenticateApiKey
};
