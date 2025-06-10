const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../config/database');
const { authenticateToken, authenticateApiKey } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

// Send notification email
router.post('/send', authenticateApiKey, [
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).withMessage('Invalid notification type'),
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

    const { to, subject, message, type = 'INFO' } = req.body;
    const notificationId = uuidv4();

    // Send notification email
    const emailResult = await sendEmail({
      emailId: notificationId,
      to,
      subject,
      template: 'notification',
      data: {
        message,
        type,
        timestamp: new Date().toISOString()
      }
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: emailResult.error
      });
    }

    // Log notification in database
    const db = getDB();
    await db.query(
      `INSERT INTO email_logs (
        id, recipient_email, subject, template_name, email_data,
        status, message_id, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        notificationId,
        to,
        subject,
        'notification',
        JSON.stringify({ message, type }),
        'SENT',
        emailResult.messageId,
        new Date()
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId,
        recipient: to,
        subject,
        type,
        messageId: emailResult.messageId,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Get notification history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    let query = `
      SELECT * FROM email_logs
      WHERE template_name = 'notification'
    `;

    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND email_data->>'type' = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    query += `
      ORDER BY sent_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.rows.length
        }
      }
    });

  } catch (error) {
    console.error('Get notification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification history'
    });
  }
});

// Health check for notifications
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
