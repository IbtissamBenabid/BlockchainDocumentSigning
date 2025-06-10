const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { authenticateApiKey } = require('../middleware/auth');
const {
  registerDocument,
  verifyDocument,
  updateDocumentState,
  getDocumentHistory
} = require('../services/fabricService');

const router = express.Router();

// Register document on blockchain
router.post('/register', authenticateApiKey, [
  body('documentId').notEmpty().withMessage('Document ID is required'),
  body('hash').notEmpty().withMessage('Document hash is required'),
  body('algorithm').isIn(['SHA-256', 'SHA-3', 'BLAKE2']).withMessage('Invalid hash algorithm'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('fileName').notEmpty().withMessage('File name is required'),
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

    const { documentId, hash, algorithm, userId, fileName } = req.body;

    // Register document on Hyperledger Fabric
    const fabricResult = await registerDocument({
      documentId,
      hash,
      algorithm,
      userId,
      fileName
    });

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to register document on blockchain',
        error: fabricResult.error
      });
    }

    // Store transaction record in database
    const db = getDB();
    await db.query(
      `INSERT INTO blockchain_transactions (
        transaction_hash, network, block_number, block_timestamp,
        status, transaction_type, related_entity_id, related_entity_type, data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        fabricResult.transactionId,
        'hyperledger-fabric',
        fabricResult.blockNumber,
        fabricResult.timestamp,
        'confirmed',
        'DOCUMENT_REGISTRATION',
        documentId,
        'document',
        JSON.stringify(fabricResult)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Document registered on blockchain successfully',
      data: {
        transactionId: fabricResult.transactionId,
        documentId,
        blockNumber: fabricResult.blockNumber,
        network: 'hyperledger-fabric',
        timestamp: fabricResult.timestamp,
        simulated: fabricResult.simulated || false
      }
    });

  } catch (error) {
    console.error('Blockchain registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify document on blockchain
router.post('/verify', authenticateApiKey, [
  body('documentId').notEmpty().withMessage('Document ID is required'),
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

    const { documentId } = req.body;

    // Verify document on Hyperledger Fabric
    const fabricResult = await verifyDocument(documentId);

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify document on blockchain',
        error: fabricResult.error
      });
    }

    res.json({
      success: true,
      message: fabricResult.verified ? 'Document verified successfully' : 'Document verification failed',
      data: {
        documentId,
        verified: fabricResult.verified,
        document: fabricResult.document,
        network: 'hyperledger-fabric',
        timestamp: fabricResult.timestamp,
        simulated: fabricResult.simulated || false
      }
    });

  } catch (error) {
    console.error('Blockchain verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update document state on blockchain
router.put('/state', authenticateApiKey, [
  body('documentId').notEmpty().withMessage('Document ID is required'),
  body('newState').isIn(['REGISTERED', 'SIGNED', 'VERIFIED', 'REVOKED', 'SHARED']).withMessage('Invalid document state'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
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

    const { documentId, newState, metadata = {} } = req.body;

    // Update document state on Hyperledger Fabric
    const fabricResult = await updateDocumentState(documentId, newState, metadata);

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update document state on blockchain',
        error: fabricResult.error
      });
    }

    // Store transaction record in database
    const db = getDB();
    await db.query(
      `INSERT INTO blockchain_transactions (
        transaction_hash, network, block_number, block_timestamp,
        status, transaction_type, related_entity_id, related_entity_type, data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        fabricResult.transactionId,
        'hyperledger-fabric',
        null, // Block number may not be available for state updates
        fabricResult.timestamp,
        'confirmed',
        'STATE_UPDATE',
        documentId,
        'document',
        JSON.stringify({ newState, metadata, ...fabricResult })
      ]
    );

    res.json({
      success: true,
      message: 'Document state updated successfully',
      data: {
        transactionId: fabricResult.transactionId,
        documentId,
        newState,
        network: 'hyperledger-fabric',
        timestamp: fabricResult.timestamp,
        simulated: fabricResult.simulated || false
      }
    });

  } catch (error) {
    console.error('Blockchain state update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get document history from blockchain
router.get('/history/:documentId', authenticateApiKey, async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Get document history from Hyperledger Fabric
    const fabricResult = await getDocumentHistory(documentId);

    if (!fabricResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get document history from blockchain',
        error: fabricResult.error
      });
    }

    res.json({
      success: true,
      message: 'Document history retrieved successfully',
      data: {
        documentId,
        history: fabricResult.history,
        network: 'hyperledger-fabric',
        timestamp: fabricResult.timestamp,
        simulated: fabricResult.simulated || false
      }
    });

  } catch (error) {
    console.error('Blockchain history retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get blockchain transaction status
router.get('/transaction/:transactionId', authenticateApiKey, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const db = getDB();

    // Get transaction from database
    const result = await db.query(
      'SELECT * FROM blockchain_transactions WHERE transaction_hash = $1',
      [transactionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const transaction = result.rows[0];

    res.json({
      success: true,
      data: {
        transactionId: transaction.transaction_hash,
        network: transaction.network,
        blockNumber: transaction.block_number,
        blockTimestamp: transaction.block_timestamp,
        status: transaction.status,
        transactionType: transaction.transaction_type,
        relatedEntityId: transaction.related_entity_id,
        relatedEntityType: transaction.related_entity_type,
        data: transaction.data,
        createdAt: transaction.created_at
      }
    });

  } catch (error) {
    console.error('Transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get blockchain network status
router.get('/status', async (req, res) => {
  try {
    const db = getDB();

    // Get recent transactions count
    const recentTransactions = await db.query(
      `SELECT COUNT(*) as count FROM blockchain_transactions 
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    // Get total transactions count
    const totalTransactions = await db.query(
      'SELECT COUNT(*) as count FROM blockchain_transactions'
    );

    res.json({
      success: true,
      data: {
        network: 'hyperledger-fabric',
        status: 'operational',
        recentTransactions: parseInt(recentTransactions.rows[0].count),
        totalTransactions: parseInt(totalTransactions.rows[0].count),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
