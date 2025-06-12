const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const emailRoutes = require('./routes/email');
const notificationRoutes = require('./routes/notifications');
const { connectDB } = require('./config/database');
const { initializeGmailService } = require('./services/gmailService');
const errorHandler = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for email sending
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 emails per windowMs
  message: 'Too many email requests, please try again later.',
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Audit logging middleware
app.use(auditLogger);

// Serve email templates (for preview)
app.use('/templates', express.static(path.join(process.cwd(), 'templates')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'email-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/email', emailLimiter, emailRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected successfully');

    // Initialize Gmail service
    try {
      await initializeGmailService();
      console.log('✅ Gmail service initialized');
    } catch (gmailError) {
      console.warn('⚠️ Gmail service initialization failed (using fallback SMTP):', gmailError.message);
    }

    // Ensure template and attachment directories exist
    const fs = require('fs');
    const templateDir = path.join(process.cwd(), 'templates');
    const attachmentDir = path.join(process.cwd(), 'attachments');

    try {
      if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
      }

      if (!fs.existsSync(attachmentDir)) {
        fs.mkdirSync(attachmentDir, { recursive: true });
      }
    } catch (error) {
      console.warn('Directory creation warning:', error.message);
      // Continue if directories already exist or can't be created
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Email Service running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`📧 Email templates directory: ${templateDir}`);
      console.log(`📎 Attachments directory: ${attachmentDir}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
