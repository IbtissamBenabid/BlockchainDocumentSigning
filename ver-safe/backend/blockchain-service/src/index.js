const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const blockchainRoutes = require('./routes/blockchain');
const fabricRoutes = require('./routes/fabric');
const { connectDB } = require('./config/database');
const { initializeFabricNetwork } = require('./services/fabricService');
const errorHandler = require('./middleware/errorHandler');
const { auditLogger } = require('./middleware/auditLogger');

const app = express();
const PORT = process.env.PORT || 3006;

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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined'));

// Audit logging middleware
app.use(auditLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'blockchain-service',
    network: 'hyperledger-fabric',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/fabric', fabricRoutes);

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

    // Initialize Hyperledger Fabric network
    try {
      await initializeFabricNetwork();
      console.log('✅ Hyperledger Fabric network initialized');
    } catch (fabricError) {
      console.warn('⚠️ Fabric network initialization failed (running in simulation mode):', fabricError.message);
    }

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Blockchain Service running on port ${PORT}`);
      console.log(`🔗 Hyperledger Fabric integration enabled`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
