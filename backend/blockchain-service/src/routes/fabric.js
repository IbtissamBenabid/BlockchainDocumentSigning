const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateApiKey } = require('../middleware/auth');
const { FABRIC_CONFIG, DOCUMENT_STATES } = require('../services/fabricService');

const router = express.Router();

// Get Fabric network information
router.get('/network', authenticateApiKey, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        channelName: FABRIC_CONFIG.channelName,
        chaincodeName: FABRIC_CONFIG.chaincodeName,
        mspId: FABRIC_CONFIG.mspId,
        userId: FABRIC_CONFIG.userId,
        caUrl: FABRIC_CONFIG.caUrl,
        caName: FABRIC_CONFIG.caName,
        documentStates: Object.values(DOCUMENT_STATES),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fabric network info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get Fabric channel information
router.get('/channel/:channelName', authenticateApiKey, async (req, res) => {
  try {
    const { channelName } = req.params;

    // In a real implementation, this would query the Fabric network
    // For now, return mock channel information
    res.json({
      success: true,
      data: {
        channelName,
        height: Math.floor(Math.random() * 1000000) + 1000000,
        currentBlockHash: require('crypto').randomBytes(32).toString('hex'),
        previousBlockHash: require('crypto').randomBytes(32).toString('hex'),
        chaincodes: [
          {
            name: FABRIC_CONFIG.chaincodeName,
            version: '1.0',
            path: 'github.com/versafe/chaincode'
          }
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fabric channel info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get chaincode information
router.get('/chaincode/:chaincodeName', authenticateApiKey, async (req, res) => {
  try {
    const { chaincodeName } = req.params;

    res.json({
      success: true,
      data: {
        name: chaincodeName,
        version: '1.0',
        language: 'golang',
        functions: [
          'RegisterDocument',
          'GetDocument',
          'UpdateDocumentState',
          'GetDocumentHistory',
          'QueryDocumentsByOwner',
          'QueryDocumentsByState'
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fabric chaincode info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Query documents by owner
router.get('/documents/owner/:userId', authenticateApiKey, async (req, res) => {
  try {
    const { userId } = req.params;

    // In a real implementation, this would query the Fabric ledger
    // For now, return mock data
    const mockDocuments = [
      {
        documentId: `DOC_${Date.now()}_1`,
        hash: require('crypto').randomBytes(32).toString('hex'),
        algorithm: 'SHA-256',
        userId,
        fileName: 'document1.pdf',
        state: DOCUMENT_STATES.REGISTERED,
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        documentId: `DOC_${Date.now()}_2`,
        hash: require('crypto').randomBytes(32).toString('hex'),
        algorithm: 'SHA-256',
        userId,
        fileName: 'document2.pdf',
        state: DOCUMENT_STATES.VERIFIED,
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        userId,
        documents: mockDocuments,
        count: mockDocuments.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fabric query by owner error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Query documents by state
router.get('/documents/state/:state', authenticateApiKey, async (req, res) => {
  try {
    const { state } = req.params;

    if (!Object.values(DOCUMENT_STATES).includes(state)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document state',
        validStates: Object.values(DOCUMENT_STATES)
      });
    }

    // In a real implementation, this would query the Fabric ledger
    // For now, return mock data
    const mockDocuments = Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
      documentId: `DOC_${Date.now()}_${i}`,
      hash: require('crypto').randomBytes(32).toString('hex'),
      algorithm: 'SHA-256',
      userId: `user_${i + 1}`,
      fileName: `document${i + 1}.pdf`,
      state,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }));

    res.json({
      success: true,
      data: {
        state,
        documents: mockDocuments,
        count: mockDocuments.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Fabric query by state error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Invoke chaincode function
router.post('/invoke', authenticateApiKey, [
  body('function').notEmpty().withMessage('Function name is required'),
  body('args').isArray().withMessage('Arguments must be an array'),
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

    const { function: functionName, args } = req.body;

    // In a real implementation, this would invoke the chaincode function
    // For now, simulate the invocation
    const transactionId = require('crypto').randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      message: `Chaincode function ${functionName} invoked successfully`,
      data: {
        transactionId,
        function: functionName,
        args,
        result: 'Function executed successfully',
        timestamp: new Date().toISOString(),
        simulated: true
      }
    });
  } catch (error) {
    console.error('Fabric invoke error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Query chaincode function
router.post('/query', authenticateApiKey, [
  body('function').notEmpty().withMessage('Function name is required'),
  body('args').isArray().withMessage('Arguments must be an array'),
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

    const { function: functionName, args } = req.body;

    // In a real implementation, this would query the chaincode function
    // For now, simulate the query
    let result;
    
    switch (functionName) {
      case 'GetDocument':
        result = {
          documentId: args[0],
          hash: require('crypto').randomBytes(32).toString('hex'),
          state: DOCUMENT_STATES.REGISTERED,
          timestamp: new Date().toISOString()
        };
        break;
      default:
        result = 'Query executed successfully';
    }
    
    res.json({
      success: true,
      message: `Chaincode function ${functionName} queried successfully`,
      data: {
        function: functionName,
        args,
        result,
        timestamp: new Date().toISOString(),
        simulated: true
      }
    });
  } catch (error) {
    console.error('Fabric query error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
