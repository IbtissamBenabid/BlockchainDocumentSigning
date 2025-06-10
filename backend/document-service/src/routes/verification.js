const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { verifyDocumentHash } = require('../services/hashService');
const { verifyOnBlockchain } = require('../services/blockchainService');

const router = express.Router();

// Verify document by hash (public endpoint)
router.post('/hash', [
  body('hash').notEmpty().withMessage('Document hash is required'),
  body('algorithm').optional().isIn(['SHA-256', 'SHA-3', 'BLAKE2']).withMessage('Invalid hash algorithm'),
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

    const { hash, algorithm = 'SHA-256' } = req.body;
    const db = getDB();

    // Find document by hash
    const result = await db.query(
      `SELECT d.id, d.title, d.file_name, d.status, d.hash, d.hash_algorithm,
              d.blockchain_tx_id, d.blockchain_network, d.created_at, d.is_revoked,
              u.name as owner_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.hash = $1 AND d.hash_algorithm = $2`,
      [hash, algorithm]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found with provided hash'
      });
    }

    const document = result.rows[0];

    // Check if document is revoked
    if (document.is_revoked) {
      return res.status(400).json({
        success: false,
        message: 'Document has been revoked',
        data: {
          document: {
            id: document.id,
            title: document.title,
            fileName: document.file_name,
            status: 'REVOKED',
            isRevoked: true,
            createdAt: document.created_at
          }
        }
      });
    }

    // Verify on blockchain
    const blockchainVerification = await verifyOnBlockchain(
      document.blockchain_tx_id,
      document.blockchain_network
    );

    // Record verification attempt
    await db.query(
      `INSERT INTO verification_history (
        document_id, verifier_name, is_verified, verification_method, details
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        document.id,
        'Anonymous Verifier',
        blockchainVerification.verified,
        'BLOCKCHAIN_VERIFICATION',
        `Hash verification: ${blockchainVerification.verified ? 'Success' : 'Failed'}`
      ]
    );

    res.json({
      success: true,
      message: blockchainVerification.verified ? 'Document verified successfully' : 'Document verification failed',
      data: {
        document: {
          id: document.id,
          title: document.title,
          fileName: document.file_name,
          status: document.status,
          hash: document.hash,
          hashAlgorithm: document.hash_algorithm,
          ownerName: document.owner_name,
          createdAt: document.created_at,
          isRevoked: document.is_revoked
        },
        verification: {
          verified: blockchainVerification.verified,
          blockchainTxId: document.blockchain_tx_id,
          blockchainNetwork: document.blockchain_network,
          ...blockchainVerification
        }
      }
    });

  } catch (error) {
    console.error('Hash verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document hash'
    });
  }
});

// Verify document by ID
router.post('/:documentId/verify', optionalAuth, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    // Get document details
    const result = await db.query(
      `SELECT d.*, u.name as owner_name
       FROM documents d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = $1`,
      [documentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = result.rows[0];

    // Check if document is revoked
    if (document.is_revoked) {
      return res.status(400).json({
        success: false,
        message: 'Document has been revoked',
        data: {
          document: {
            id: document.id,
            title: document.title,
            fileName: document.file_name,
            status: 'REVOKED',
            isRevoked: true,
            revokedReason: document.revoked_reason,
            revokedAt: document.revoked_at
          }
        }
      });
    }

    // Verify file integrity if file exists
    let fileVerification = { verified: true, message: 'File verification skipped' };
    if (document.file_path && require('fs').existsSync(document.file_path)) {
      fileVerification = await verifyDocumentHash(document.file_path, document.hash, document.hash_algorithm);
    }

    // Verify on blockchain
    const blockchainVerification = await verifyOnBlockchain(
      document.blockchain_tx_id,
      document.blockchain_network
    );

    const overallVerified = fileVerification.verified && blockchainVerification.verified;

    // Record verification attempt
    await db.query(
      `INSERT INTO verification_history (
        document_id, verifier_id, verifier_name, is_verified, verification_method, details
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        document.id,
        req.user?.userId || null,
        req.user?.name || 'Anonymous Verifier',
        overallVerified,
        'MULTI_FACTOR',
        `File: ${fileVerification.verified ? 'OK' : 'FAIL'}, Blockchain: ${blockchainVerification.verified ? 'OK' : 'FAIL'}`
      ]
    );

    res.json({
      success: true,
      message: overallVerified ? 'Document verified successfully' : 'Document verification failed',
      data: {
        document: {
          id: document.id,
          title: document.title,
          fileName: document.file_name,
          fileType: document.file_type,
          status: document.status,
          hash: document.hash,
          hashAlgorithm: document.hash_algorithm,
          ownerName: document.owner_name,
          createdAt: document.created_at,
          isRevoked: document.is_revoked
        },
        verification: {
          verified: overallVerified,
          fileVerification,
          blockchainVerification,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify document'
    });
  }
});

// Get verification history for a document
router.get('/:documentId/history', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    // Check if user has access to the document
    const accessResult = await db.query(
      `SELECT d.id FROM documents d
       LEFT JOIN document_shares ds ON d.id = ds.document_id
       WHERE d.id = $1 AND (d.user_id = $2 OR ds.shared_with_user_id = $2)`,
      [documentId, req.user.userId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Get verification history
    const result = await db.query(
      `SELECT vh.*, u.name as verifier_name_full
       FROM verification_history vh
       LEFT JOIN users u ON vh.verifier_id = u.id
       WHERE vh.document_id = $1
       ORDER BY vh.created_at DESC`,
      [documentId]
    );

    const verificationHistory = result.rows.map(record => ({
      id: record.id,
      verifierId: record.verifier_id,
      verifierName: record.verifier_name_full || record.verifier_name,
      isVerified: record.is_verified,
      verificationMethod: record.verification_method,
      details: record.details,
      complianceFramework: record.compliance_framework,
      jurisdictionCode: record.jurisdiction_code,
      regulatoryStatus: record.regulatory_status,
      createdAt: record.created_at
    }));

    res.json({
      success: true,
      data: {
        documentId,
        verificationHistory
      }
    });

  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verification history'
    });
  }
});

// Bulk verify multiple documents
router.post('/bulk', authenticateToken, [
  body('documentIds').isArray({ min: 1, max: 10 }).withMessage('Document IDs must be an array with 1-10 items'),
  body('documentIds.*').isUUID().withMessage('Each document ID must be a valid UUID'),
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

    const { documentIds } = req.body;
    const db = getDB();

    const verificationResults = [];

    for (const documentId of documentIds) {
      try {
        // Get document details
        const result = await db.query(
          `SELECT d.* FROM documents d
           LEFT JOIN document_shares ds ON d.id = ds.document_id
           WHERE d.id = $1 AND (d.user_id = $2 OR ds.shared_with_user_id = $2)`,
          [documentId, req.user.userId]
        );

        if (result.rows.length === 0) {
          verificationResults.push({
            documentId,
            verified: false,
            error: 'Document not found or access denied'
          });
          continue;
        }

        const document = result.rows[0];

        if (document.is_revoked) {
          verificationResults.push({
            documentId,
            verified: false,
            error: 'Document has been revoked'
          });
          continue;
        }

        // Quick blockchain verification
        const blockchainVerification = await verifyOnBlockchain(
          document.blockchain_tx_id,
          document.blockchain_network
        );

        verificationResults.push({
          documentId,
          title: document.title,
          fileName: document.file_name,
          verified: blockchainVerification.verified,
          blockchainTxId: document.blockchain_tx_id,
          verificationTimestamp: new Date().toISOString()
        });

        // Record verification
        await db.query(
          `INSERT INTO verification_history (
            document_id, verifier_id, verifier_name, is_verified, verification_method, details
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            documentId,
            req.user.userId,
            req.user.name,
            blockchainVerification.verified,
            'BLOCKCHAIN_VERIFICATION',
            'Bulk verification'
          ]
        );

      } catch (error) {
        verificationResults.push({
          documentId,
          verified: false,
          error: 'Verification failed'
        });
      }
    }

    const successCount = verificationResults.filter(r => r.verified).length;

    res.json({
      success: true,
      message: `Bulk verification completed: ${successCount}/${documentIds.length} documents verified`,
      data: {
        results: verificationResults,
        summary: {
          total: documentIds.length,
          verified: successCount,
          failed: documentIds.length - successCount
        }
      }
    });

  } catch (error) {
    console.error('Bulk verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk verification'
    });
  }
});

module.exports = router;
