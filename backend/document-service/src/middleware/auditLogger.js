const { getDB } = require('../config/database');

// Middleware to log document-related actions for audit purposes
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
    // Skip logging for health checks and static files
    if (req.path === '/health' || req.path.startsWith('/uploads')) {
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
      fileInfo: extractFileInfo(req),
      queryParams: req.query,
      headers: sanitizeHeaders(req.headers),
      documentAccess: req.documentAccess || null
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
    'POST /api/documents/upload': 'DOCUMENT_UPLOAD',
    'GET /api/documents': 'DOCUMENT_LIST',
    'GET /api/documents/': 'DOCUMENT_VIEW',
    'PUT /api/documents/': 'DOCUMENT_UPDATE',
    'DELETE /api/documents/': 'DOCUMENT_DELETE',
    'POST /api/verification/hash': 'DOCUMENT_VERIFY_HASH',
    'POST /api/verification/': 'DOCUMENT_VERIFY',
    'GET /api/verification/': 'VERIFICATION_HISTORY',
    'POST /api/verification/bulk': 'DOCUMENT_BULK_VERIFY'
  };

  // Handle parameterized routes
  let key = `${method} ${path}`;
  
  // Replace UUID patterns with placeholder
  key = key.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/');
  
  return actionMap[key] || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function extractResourceInfo(req) {
  // Extract resource type and ID from the request
  let resourceType = null;
  let resourceId = null;

  if (req.path.includes('/documents/')) {
    resourceType = 'document';
    const matches = req.path.match(/\/documents\/([^\/]+)/);
    if (matches && matches[1] !== 'upload') {
      resourceId = matches[1];
    }
  }

  if (req.path.includes('/verification/')) {
    resourceType = 'verification';
    const matches = req.path.match(/\/verification\/([^\/]+)/);
    if (matches && matches[1] !== 'hash' && matches[1] !== 'bulk') {
      resourceId = matches[1];
    }
  }

  return { resourceType, resourceId };
}

function extractFileInfo(req) {
  if (!req.file) {
    return null;
  }

  return {
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    fieldName: req.file.fieldname
  };
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
