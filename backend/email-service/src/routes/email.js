const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const { authenticateToken, authenticateApiKey } = require('../middleware/auth');
const { 
  sendEmail,
  sendDocumentShareEmail,
  sendSignatureRequestEmail,
  sendDocumentSignedEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../services/emailService');

const router = express.Router();

// Send general email
router.post('/send', authenticateApiKey, [
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('template').optional().isString().withMessage('Template must be a string'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { to, subject, template, data = {}, attachments = [] } = req.body;
    const emailId = uuidv4();

    // Send email
    const emailResult = await sendEmail({
      emailId,
      to,
      subject,
      template,
      data,
      attachments
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error
      });
    }

    // Log email in database
    const db = getDB();
    await db.query(
      `INSERT INTO email_logs (
        id, recipient_email, subject, template_name, email_data,
        status, message_id, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        emailId,
        to,
        subject,
        template || 'custom',
        JSON.stringify(data),
        'SENT',
        emailResult.messageId,
        new Date()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        emailId,
        messageId: emailResult.messageId,
        recipient: to,
        subject,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email'
    });
  }
});

// Share document via email
router.post('/share-document', authenticateToken, [
  body('documentId').isUUID().withMessage('Valid document ID is required'),
  body('recipientEmail').isEmail().withMessage('Valid recipient email is required'),
  body('accessLevel').isIn(['VIEW', 'COMMENT', 'EDIT']).withMessage('Invalid access level'),
  body('message').optional().isString().withMessage('Message must be a string'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { documentId, recipientEmail, accessLevel, message, expiryDate } = req.body;
    const db = getDB();

    // Check if document exists and user has permission to share
    const documentResult = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or permission denied'
      });
    }

    const document = documentResult.rows[0];

    // Generate share token
    const shareToken = uuidv4();
    const shareId = uuidv4();

    // Create document share record
    await db.query(
      `INSERT INTO document_shares (
        id, document_id, shared_by_user_id, shared_with_email, access_level,
        share_token, personal_message, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        shareId,
        documentId,
        req.user.userId,
        recipientEmail,
        accessLevel,
        shareToken,
        message,
        expiryDate
      ]
    );

    // Send share email
    const emailResult = await sendDocumentShareEmail({
      recipientEmail,
      senderName: req.user.name,
      documentTitle: document.title,
      documentId,
      shareToken,
      accessLevel,
      message,
      expiryDate
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send share email',
        error: emailResult.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document shared successfully',
      data: {
        shareId,
        documentId,
        recipientEmail,
        accessLevel,
        shareToken,
        expiryDate,
        emailSent: true,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document'
    });
  }
});

// Request signature via email
router.post('/request-signature', authenticateToken, [
  body('documentId').isUUID().withMessage('Valid document ID is required'),
  body('signerEmail').isEmail().withMessage('Valid signer email is required'),
  body('signerName').optional().isString().withMessage('Signer name must be a string'),
  body('message').optional().isString().withMessage('Message must be a string'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { documentId, signerEmail, signerName, message, dueDate } = req.body;
    const db = getDB();

    // Check if document exists and user has permission
    const documentResult = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or permission denied'
      });
    }

    const document = documentResult.rows[0];

    // Generate signature request token
    const requestToken = uuidv4();
    const requestId = uuidv4();

    // Create signature request record
    await db.query(
      `INSERT INTO signature_requests (
        id, document_id, requester_user_id, signer_email, signer_name,
        request_token, personal_message, due_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        requestId,
        documentId,
        req.user.userId,
        signerEmail,
        signerName,
        requestToken,
        message,
        dueDate,
        'PENDING'
      ]
    );

    // Send signature request email
    const emailResult = await sendSignatureRequestEmail({
      signerEmail,
      signerName,
      requesterName: req.user.name,
      documentTitle: document.title,
      documentId,
      requestToken,
      message,
      dueDate
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send signature request email',
        error: emailResult.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Signature request sent successfully',
      data: {
        requestId,
        documentId,
        signerEmail,
        signerName,
        requestToken,
        dueDate,
        emailSent: true,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Request signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send signature request'
    });
  }
});

// Notify document signed
router.post('/notify-signed', authenticateApiKey, [
  body('documentId').isUUID().withMessage('Valid document ID is required'),
  body('signerEmail').isEmail().withMessage('Valid signer email is required'),
  body('ownerEmail').isEmail().withMessage('Valid owner email is required'),
  body('documentTitle').notEmpty().withMessage('Document title is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { documentId, signerEmail, ownerEmail, documentTitle } = req.body;

    // Send notification to document owner
    const emailResult = await sendDocumentSignedEmail({
      ownerEmail,
      signerEmail,
      documentTitle,
      documentId,
      signedAt: new Date().toISOString()
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification email',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'Signature notification sent successfully',
      data: {
        documentId,
        ownerEmail,
        signerEmail,
        emailSent: true,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Notify signed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Send welcome email
router.post('/welcome', authenticateApiKey, [
  body('userEmail').isEmail().withMessage('Valid user email is required'),
  body('userName').notEmpty().withMessage('User name is required'),
  body('verificationToken').optional().isString().withMessage('Verification token must be a string'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userEmail, userName, verificationToken } = req.body;

    // Send welcome email
    const emailResult = await sendWelcomeEmail({
      userEmail,
      userName,
      verificationToken
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send welcome email',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'Welcome email sent successfully',
      data: {
        userEmail,
        userName,
        emailSent: true,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Send welcome email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email'
    });
  }
});

// Send password reset email
router.post('/password-reset', authenticateApiKey, [
  body('userEmail').isEmail().withMessage('Valid user email is required'),
  body('userName').notEmpty().withMessage('User name is required'),
  body('resetToken').notEmpty().withMessage('Reset token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userEmail, userName, resetToken } = req.body;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      userEmail,
      userName,
      resetToken
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
        error: emailResult.error
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
      data: {
        userEmail,
        userName,
        emailSent: true,
        messageId: emailResult.messageId
      }
    });

  } catch (error) {
    console.error('Send password reset email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email'
    });
  }
});

// Get email logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, template } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    // Build query with filters
    let query = `
      SELECT * FROM email_logs
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (template) {
      query += ` AND template_name = $${paramCount}`;
      params.push(template);
      paramCount++;
    }

    query += `
      ORDER BY sent_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM email_logs WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (template) {
      countQuery += ` AND template_name = $${countParamCount}`;
      countParams.push(template);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const emails = result.rows.map(email => ({
      id: email.id,
      recipientEmail: email.recipient_email,
      subject: email.subject,
      templateName: email.template_name,
      status: email.status,
      messageId: email.message_id,
      sentAt: email.sent_at,
      deliveredAt: email.delivered_at,
      openedAt: email.opened_at,
      clickedAt: email.clicked_at
    }));

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email logs'
    });
  }
});

// Get email statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const db = getDB();

    // Calculate date range based on period
    let dateFilter = '';
    switch (period) {
      case '24h':
        dateFilter = "sent_at > NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        dateFilter = "sent_at > NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        dateFilter = "sent_at > NOW() - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "sent_at > NOW() - INTERVAL '7 days'";
    }

    // Get email statistics
    const statsResult = await db.query(`
      SELECT
        COUNT(*) as total_sent,
        COUNT(CASE WHEN status = 'SENT' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
        COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
        COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked
      FROM email_logs
      WHERE ${dateFilter}
    `);

    // Get template statistics
    const templateResult = await db.query(`
      SELECT
        template_name,
        COUNT(*) as count
      FROM email_logs
      WHERE ${dateFilter}
      GROUP BY template_name
      ORDER BY count DESC
      LIMIT 10
    `);

    const stats = statsResult.rows[0];
    const templateStats = templateResult.rows;

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalSent: parseInt(stats.total_sent),
          sent: parseInt(stats.sent),
          delivered: parseInt(stats.delivered),
          failed: parseInt(stats.failed),
          opened: parseInt(stats.opened),
          clicked: parseInt(stats.clicked),
          deliveryRate: stats.total_sent > 0 ? (stats.delivered / stats.total_sent * 100).toFixed(2) : 0,
          openRate: stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(2) : 0,
          clickRate: stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(2) : 0
        },
        templateStats
      }
    });

  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email statistics'
    });
  }
});

module.exports = router;
