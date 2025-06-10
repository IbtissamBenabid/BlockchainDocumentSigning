const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

// Middleware to authenticate JWT tokens
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const db = getDB();
    const result = await db.query(
      'SELECT id, email, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: result.rows[0].email,
      name: result.rows[0].name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Middleware for optional authentication (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const db = getDB();
    const result = await db.query(
      'SELECT id, email, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active) {
      req.user = {
        userId: decoded.userId,
        email: result.rows[0].email,
        name: result.rows[0].name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    req.user = null;
    next();
  }
}

// Middleware to check if user is verified
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // In a real app, you'd check the is_verified field from the database
  // For now, we'll assume all users are verified after login
  next();
}

// Middleware for API key authentication (for inter-service communication)
async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }

    const db = getDB();
    const result = await db.query(
      'SELECT service_name, permissions FROM api_keys WHERE key_hash = $1 AND is_active = TRUE AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const apiKeyData = result.rows[0];

    // Update last used timestamp
    await db.query(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = $1',
      [apiKey]
    );

    req.service = {
      name: apiKeyData.service_name,
      permissions: apiKeyData.permissions
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerified,
  authenticateApiKey
};
