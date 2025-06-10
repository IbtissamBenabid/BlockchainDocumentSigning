const { getDB } = require('../config/database');

// Middleware to log blockchain-related actions for audit purposes
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
    // Skip logging for health checks
    if (req.path === '/health') {
      return;
    }

    const db = getDB();
    
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
      blockchainOperation: extractBlockchainOperation(req, responseData),
      queryParams: req.query,
      headers: sanitizeHeaders(req.headers)
    };

    // Insert audit log
    await db.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        null, // No user ID for service-to-service calls
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
    'POST /api/blockchain/register': 'BLOCKCHAIN_REGISTER_DOCUMENT',
    'POST /api/blockchain/verify': 'BLOCKCHAIN_VERIFY_DOCUMENT',
    'PUT /api/blockchain/state': 'BLOCKCHAIN_UPDATE_STATE',
    'GET /api/blockchain/history/': 'BLOCKCHAIN_GET_HISTORY',
    'GET /api/blockchain/transaction/': 'BLOCKCHAIN_GET_TRANSACTION',
    'GET /api/blockchain/status': 'BLOCKCHAIN_GET_STATUS',
    'GET /api/fabric/network': 'FABRIC_GET_NETWORK_INFO',
    'GET /api/fabric/channel/': 'FABRIC_GET_CHANNEL_INFO',
    'GET /api/fabric/chaincode/': 'FABRIC_GET_CHAINCODE_INFO',
    'GET /api/fabric/documents/owner/': 'FABRIC_QUERY_BY_OWNER',
    'GET /api/fabric/documents/state/': 'FABRIC_QUERY_BY_STATE',
    'POST /api/fabric/invoke': 'FABRIC_INVOKE_CHAINCODE',
    'POST /api/fabric/query': 'FABRIC_QUERY_CHAINCODE'
  };

  // Handle parameterized routes
  let key = `${method} ${path}`;
  
  // Replace UUID patterns with placeholder
  key = key.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/');
  key = key.replace(/\/[a-zA-Z0-9_-]+$/g, '/'); // Replace path parameters
  
  return actionMap[key] || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

function extractResourceInfo(req) {
  // Extract resource type and ID from the request
  let resourceType = null;
  let resourceId = null;

  if (req.path.includes('/blockchain/')) {
    resourceType = 'blockchain';
    
    if (req.path.includes('/history/')) {
      const matches = req.path.match(/\/history\/([^\/]+)/);
      if (matches) {
        resourceId = matches[1];
      }
    } else if (req.path.includes('/transaction/')) {
      const matches = req.path.match(/\/transaction\/([^\/]+)/);
      if (matches) {
        resourceId = matches[1];
      }
    }
  }

  if (req.path.includes('/fabric/')) {
    resourceType = 'fabric';
    
    if (req.path.includes('/channel/')) {
      const matches = req.path.match(/\/channel\/([^\/]+)/);
      if (matches) {
        resourceId = matches[1];
      }
    } else if (req.path.includes('/chaincode/')) {
      const matches = req.path.match(/\/chaincode\/([^\/]+)/);
      if (matches) {
        resourceId = matches[1];
      }
    }
  }

  return { resourceType, resourceId };
}

function extractBlockchainOperation(req, responseData) {
  const operation = {
    type: null,
    transactionId: null,
    documentId: null,
    network: 'hyperledger-fabric'
  };

  if (req.body) {
    operation.documentId = req.body.documentId;
  }

  if (responseData && responseData.data) {
    operation.transactionId = responseData.data.transactionId;
    operation.documentId = responseData.data.documentId || operation.documentId;
  }

  if (req.path.includes('/register')) {
    operation.type = 'REGISTER';
  } else if (req.path.includes('/verify')) {
    operation.type = 'VERIFY';
  } else if (req.path.includes('/state')) {
    operation.type = 'UPDATE_STATE';
  } else if (req.path.includes('/history')) {
    operation.type = 'GET_HISTORY';
  }

  return operation;
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
