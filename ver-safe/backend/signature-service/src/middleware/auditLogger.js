const { getDB } = require('../config/database');

// Middleware to log signature-related actions for audit purposes
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
    if (req.path === '/health' || req.path.startsWith('/signatures/')) {
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
      signatureInfo: extractSignatureInfo(req, responseData),
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
    'POST /api/signatures/': 'DOCUMENT_SIGN',
    'POST /api/signatures/': 'SIGNATURE_UPLOAD',
    'GET /api/signatures/': 'SIGNATURE_VIEW',
    'POST /api/signatures/': 'SIGNATURE_VERIFY',
    'DELETE /api/signatures/': 'SIGNATURE_DELETE',
    'POST /api/signatures/keys/generate': 'SIGNING_KEYS_GENERATE',
    'GET /api/signatures/keys': 'SIGNING_KEYS_LIST',
    'GET /api/certificates/': 'CERTIFICATE_VIEW',
    'POST /api/certificates/generate': 'CERTIFICATE_GENERATE'
  };

  // Handle parameterized routes
  let key = `${method} ${path}`;
  
  // Replace UUID patterns with placeholder
  key = key.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/');
  
  // Handle specific signature endpoints
  if (path.includes('/sign')) {
    return 'DOCUMENT_SIGN';
  } else if (path.includes('/upload-signature')) {
    return 'SIGNATURE_UPLOAD';
  } else if (path.includes('/verify')) {
    return 'SIGNATURE_VERIFY';
  }
  
  return actionMap[key] || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function extractResourceInfo(req) {
  // Extract resource type and ID from the request
  let resourceType = null;
  let resourceId = null;

  if (req.path.includes('/signatures/')) {
    resourceType = 'signature';
    
    // Extract document ID or signature ID from path
    const documentMatch = req.path.match(/\/signatures\/([^\/]+)\/sign/);
    const signatureMatch = req.path.match(/\/signatures\/([^\/]+)\/verify/);
    const idMatch = req.path.match(/\/signatures\/([^\/]+)$/);
    
    if (documentMatch) {
      resourceId = documentMatch[1]; // Document ID
      resourceType = 'document';
    } else if (signatureMatch || idMatch) {
      resourceId = (signatureMatch || idMatch)[1]; // Signature ID
    }
  }

  if (req.path.includes('/certificates/')) {
    resourceType = 'certificate';
    const matches = req.path.match(/\/certificates\/([^\/]+)/);
    if (matches) {
      resourceId = matches[1];
    }
  }

  return { resourceType, resourceId };
}

function extractSignatureInfo(req, responseData) {
  const signatureInfo = {
    signatureType: null,
    documentId: null,
    signatureId: null,
    verified: null
  };

  // Extract from request body
  if (req.body) {
    signatureInfo.signatureType = req.body.signatureType;
    signatureInfo.documentId = req.params?.documentId;
  }

  // Extract from response data
  if (responseData && responseData.data) {
    if (responseData.data.signature) {
      signatureInfo.signatureId = responseData.data.signature.id;
      signatureInfo.signatureType = responseData.data.signature.signatureType;
      signatureInfo.verified = responseData.data.signature.isVerified;
    }
    
    if (responseData.data.document) {
      signatureInfo.documentId = responseData.data.document.id;
    }
  }

  return signatureInfo;
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
