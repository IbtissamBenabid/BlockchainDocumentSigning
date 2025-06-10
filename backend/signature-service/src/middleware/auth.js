const jwt = require('jsonwebtoken');
const axios = require('axios');

// Cache for user data to reduce API calls
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to authenticate JWT tokens by calling auth service
 */
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

    // Verify token locally first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
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
      
      throw error;
    }

    // Check cache first
    const cacheKey = `user_${decoded.userId}`;
    const cachedUser = userCache.get(cacheKey);
    
    if (cachedUser && (Date.now() - cachedUser.timestamp) < CACHE_TTL) {
      req.user = cachedUser.data;
      return next();
    }

    // Call auth service to get user details
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const response = await axios.get(`${authServiceUrl}/api/users/${decoded.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': process.env.INTERNAL_API_KEY
        },
        timeout: 5000
      });

      if (response.data.success) {
        const userData = {
          userId: response.data.data.user.id,
          email: response.data.data.user.email,
          name: response.data.data.user.name,
          isVerified: response.data.data.user.isVerified
        };

        // Cache user data
        userCache.set(cacheKey, {
          data: userData,
          timestamp: Date.now()
        });

        req.user = userData;
        next();
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        });
      }

    } catch (authError) {
      console.error('Auth service call failed:', authError.message);
      
      // Fallback: use token data if auth service is unavailable
      req.user = {
        userId: decoded.userId,
        email: 'unknown@example.com',
        name: 'Unknown User',
        isVerified: false
      };
      
      next();
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

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

/**
 * Clear user cache (useful for testing or when user data changes)
 */
function clearUserCache(userId = null) {
  if (userId) {
    userCache.delete(`user_${userId}`);
  } else {
    userCache.clear();
  }
}

module.exports = {
  authenticateToken,
  authenticateApiKey,
  clearUserCache
};
