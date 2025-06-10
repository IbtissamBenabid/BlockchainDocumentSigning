const { getDB } = require('../config/database');

// Middleware to log user actions for audit purposes
async function auditLogger(req, res, next) {
  // Store original res.json to intercept responses
  const originalJson = res.json;
  
  res.json = function(data) {
    // Log the action after response is sent
    setImmediate(async () => {
      try {
        await logAction(req, res, data);
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    });
    
    // Call original json method
    return originalJson.call(this, data);
  };

  next();
}

async function logAction(req, res, responseData) {
  try {
    // Skip logging for health checks and non-important routes
    if (req.path === '/health' || req.path.startsWith('/static')) {
      return;
    }

    const db = getDB();
    
    // Extract user ID from request (if authenticated)
    const userId = req.user?.userId || null;
    
    // Determine action based on method and path
    const action = getActionName(req.method, req.path);
    
    // Extract resource information
    const { resourceType, resourceId } = extractResourceInfo(req);
    
    // Get client IP (considering proxy headers)
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Get user agent
    const userAgent = req.get('User-Agent');
    
    // Prepare audit log data
    const auditData = {
      success: responseData?.success !== false,
      statusCode: res.statusCode,
      responseTime: Date.now() - req.startTime,
      requestBody: sanitizeRequestBody(req.body, req.path),
      queryParams: req.query,
      headers: sanitizeHeaders(req.headers)
    };

    // Insert audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        JSON.stringify(auditData)
      ]
    );

  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

function getActionName(method, path) {
  // Map HTTP methods and paths to meaningful action names
  const actionMap = {
    'POST /api/auth/register': 'USER_REGISTER',
    'POST /api/auth/login': 'USER_LOGIN',
    'POST /api/auth/logout': 'USER_LOGOUT',
    'POST /api/auth/refresh': 'TOKEN_REFRESH',
    'POST /api/auth/forgot-password': 'PASSWORD_RESET_REQUEST',
    'POST /api/auth/reset-password': 'PASSWORD_RESET',
    'POST /api/auth/verify-email': 'EMAIL_VERIFICATION',
    'GET /api/users/me': 'PROFILE_VIEW',
    'PUT /api/users/me': 'PROFILE_UPDATE',
    'PUT /api/users/change-password': 'PASSWORD_CHANGE',
    'DELETE /api/users/me': 'ACCOUNT_DEACTIVATE'
  };

  const key = `${method} ${path}`;
  return actionMap[key] || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function extractResourceInfo(req) {
  // Extract resource type and ID from the request
  let resourceType = null;
  let resourceId = null;

  if (req.path.includes('/users/')) {
    resourceType = 'user';
    const matches = req.path.match(/\/users\/([^\/]+)/);
    if (matches && matches[1] !== 'me') {
      resourceId = matches[1];
    }
  }

  return { resourceType, resourceId };
}

function sanitizeRequestBody(body, path) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Remove sensitive fields
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') {
    return headers;
  }

  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized = { ...headers };

  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });

  return sanitized;
}

module.exports = {
  auditLogger
};
