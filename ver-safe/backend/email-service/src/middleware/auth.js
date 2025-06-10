const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware to authenticate API keys for inter-service communication
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  // In production, you should validate against a secure list of API keys
  const validApiKeys = [
    'versafe-internal-api-key-2024',
    'your-internal-api-key',
    process.env.INTERNAL_API_KEY
  ].filter(Boolean);

  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key'
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  authenticateApiKey
};
