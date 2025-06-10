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
 * Middleware for optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Try to authenticate, but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check cache
      const cacheKey = `user_${decoded.userId}`;
      const cachedUser = userCache.get(cacheKey);
      
      if (cachedUser && (Date.now() - cachedUser.timestamp) < CACHE_TTL) {
        req.user = cachedUser.data;
        return next();
      }

      // Try to get user from auth service
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const response = await axios.get(`${authServiceUrl}/api/users/${decoded.userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-API-Key': process.env.INTERNAL_API_KEY
        },
        timeout: 3000
      });

      if (response.data.success) {
        const userData = {
          userId: response.data.data.user.id,
          email: response.data.data.user.email,
          name: response.data.data.user.name,
          isVerified: response.data.data.user.isVerified
        };

        userCache.set(cacheKey, {
          data: userData,
          timestamp: Date.now()
        });

        req.user = userData;
      } else {
        req.user = null;
      }

    } catch (error) {
      req.user = null;
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
}

/**
 * Middleware to check if user is verified
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }

  next();
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
 * Middleware to check document ownership or sharing permissions
 */
async function checkDocumentAccess(req, res, next) {
  try {
    const { documentId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { getDB } = require('../config/database');
    const db = getDB();

    // Check if user owns the document or has shared access
    const result = await db.query(
      `SELECT d.id, d.user_id, ds.access_level
       FROM documents d
       LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.shared_with_user_id = $2
       WHERE d.id = $1 AND (d.user_id = $2 OR ds.shared_with_user_id = $2)`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const document = result.rows[0];
    req.documentAccess = {
      isOwner: document.user_id === userId,
      accessLevel: document.access_level || 'owner'
    };

    next();

  } catch (error) {
    console.error('Document access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
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
  optionalAuth,
  requireVerified,
  authenticateApiKey,
  checkDocumentAccess,
  clearUserCache
};
