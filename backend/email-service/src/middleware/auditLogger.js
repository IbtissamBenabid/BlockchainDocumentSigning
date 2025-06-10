const { getDB } = require('../config/database');

/**
 * Audit logging middleware for email service
 * Logs all email-related activities for compliance and monitoring
 */

const auditLogger = async (req, res, next) => {
  // Skip audit logging for health checks and static files
  if (req.path === '/health' || req.path.startsWith('/templates')) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  // Capture response data
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log the audit entry asynchronously
    setImmediate(() => {
      logAuditEntry(req, res, data, duration).catch(error => {
        console.error('Audit logging failed:', error);
      });
    });

    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

async function logAuditEntry(req, res, responseData, duration) {
  try {
    const db = getDB();
    
    // Extract relevant information
    const auditData = {
      timestamp: new Date(),
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      duration,
      action: getActionName(req.method, req.path),
      userId: req.user?.userId || null,
      apiKey: req.headers['x-api-key'] ? 'present' : null,
      requestSize: req.get('Content-Length') || 0,
      responseSize: Buffer.byteLength(responseData || '', 'utf8')
    };

    // Add email-specific audit data
    if (req.body) {
      if (req.body.to) {
        auditData.recipientEmail = req.body.to;
      }
      if (req.body.subject) {
        auditData.emailSubject = req.body.subject;
      }
      if (req.body.template) {
        auditData.emailTemplate = req.body.template;
      }
    }

    // Parse response for additional context
    try {
      const parsedResponse = JSON.parse(responseData);
      if (parsedResponse.data?.messageId) {
        auditData.messageId = parsedResponse.data.messageId;
      }
      if (parsedResponse.data?.emailId) {
        auditData.emailId = parsedResponse.data.emailId;
      }
    } catch (e) {
      // Response is not JSON, ignore
    }

    // Insert audit log
    await db.query(
      `INSERT INTO audit_logs (
        timestamp, service_name, action, method, path, 
        user_id, ip_address, user_agent, status_code, 
        duration_ms, request_size, response_size, 
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        auditData.timestamp,
        'email-service',
        auditData.action,
        auditData.method,
        auditData.path,
        auditData.userId,
        auditData.ip,
        auditData.userAgent,
        auditData.statusCode,
        auditData.duration,
        auditData.requestSize,
        auditData.responseSize,
        JSON.stringify({
          query: auditData.query,
          recipientEmail: auditData.recipientEmail,
          emailSubject: auditData.emailSubject,
          emailTemplate: auditData.emailTemplate,
          messageId: auditData.messageId,
          emailId: auditData.emailId,
          apiKey: auditData.apiKey
        })
      ]
    );

    // Log security events
    if (auditData.statusCode === 401 || auditData.statusCode === 403) {
      console.warn('Security event:', {
        action: 'UNAUTHORIZED_ACCESS',
        ip: auditData.ip,
        path: auditData.path,
        userAgent: auditData.userAgent,
        timestamp: auditData.timestamp
      });
    }

    // Log email sending events
    if (auditData.action === 'EMAIL_SEND' && auditData.statusCode === 201) {
      console.info('Email sent:', {
        recipient: auditData.recipientEmail,
        subject: auditData.emailSubject,
        template: auditData.emailTemplate,
        messageId: auditData.messageId,
        timestamp: auditData.timestamp
      });
    }

  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

function getActionName(method, path) {
  // Map HTTP methods and paths to meaningful action names
  const actionMap = {
    'POST /api/email/send': 'EMAIL_SEND',
    'POST /api/email/share-document': 'DOCUMENT_SHARE',
    'POST /api/email/request-signature': 'SIGNATURE_REQUEST',
    'POST /api/email/notify-signed': 'SIGNATURE_NOTIFICATION',
    'POST /api/email/welcome': 'WELCOME_EMAIL',
    'POST /api/email/password-reset': 'PASSWORD_RESET_EMAIL',
    'GET /api/email/logs': 'EMAIL_LOGS_VIEW',
    'POST /api/notifications/send': 'NOTIFICATION_SEND',
    'GET /api/notifications/history': 'NOTIFICATION_HISTORY_VIEW',
    'GET /health': 'HEALTH_CHECK'
  };

  const key = `${method} ${path}`;
  return actionMap[key] || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
}

module.exports = {
  auditLogger
};
