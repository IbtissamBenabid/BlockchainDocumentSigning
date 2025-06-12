const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { 
  createElectronicSignature,
  createDigitalSignature,
  createBiometricSignature,
  verifySignature,
  generateSigningKeys
} = require('../services/signatureService');
const { updateDocumentStateOnBlockchain } = require('../services/blockchainIntegration');

const router = express.Router();

// Configure multer for signature uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const signaturePath = process.env.SIGNATURE_PATH || path.join(__dirname, '../../signatures');
    if (!fs.existsSync(signaturePath)) {
      fs.mkdirSync(signaturePath, { recursive: true });
    }
    cb(null, signaturePath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `signature-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for signature images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for signature'), false);
    }
  }
});

// Sign document with electronic signature
router.post('/:documentId/sign', authenticateToken, [
  body('signatureType').isIn(['ELECTRONIC', 'DIGITAL', 'BIOMETRIC', 'DRAWN', 'TYPED']).withMessage('Invalid signature type'),
  body('signatureData').optional().isString().withMessage('Signature data must be a string'),
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

    const { documentId } = req.params;
    const { signatureType, signatureData, metadata = {} } = req.body;
    const db = getDB();

    // Check if document exists and user has access
    const documentResult = await db.query(
      `SELECT d.*, ds.access_level FROM documents d
       LEFT JOIN document_shares ds ON d.id = ds.document_id AND ds.shared_with_user_id = $2
       WHERE d.id = $1 AND (d.user_id = $2 OR ds.shared_with_user_id = $2)`,
      [documentId, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const document = documentResult.rows[0];

    // Check if document is already revoked
    if (document.is_revoked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot sign a revoked document'
      });
    }

    // Check if user already signed this document
    const existingSignature = await db.query(
      'SELECT id FROM signatures WHERE document_id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (existingSignature.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Document already signed by this user'
      });
    }

    // Create signature based on type
    let signatureResult;
    const signatureId = uuidv4();

    switch (signatureType) {
      case 'ELECTRONIC':
        signatureResult = await createElectronicSignature({
          signatureId,
          documentId,
          userId: req.user.userId,
          signatureData,
          metadata
        });
        break;
      
      case 'DIGITAL':
        signatureResult = await createDigitalSignature({
          signatureId,
          documentId,
          userId: req.user.userId,
          documentHash: document.hash,
          metadata
        });
        break;
      
      case 'BIOMETRIC':
        signatureResult = await createBiometricSignature({
          signatureId,
          documentId,
          userId: req.user.userId,
          biometricData: signatureData,
          metadata
        });
        break;
      
      case 'DRAWN':
      case 'TYPED':
        signatureResult = await createElectronicSignature({
          signatureId,
          documentId,
          userId: req.user.userId,
          signatureData,
          metadata: { ...metadata, inputMethod: signatureType }
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported signature type'
        });
    }

    if (!signatureResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create signature',
        error: signatureResult.error
      });
    }

    // Store signature in database
    const insertResult = await db.query(
      `INSERT INTO signatures (
        id, document_id, user_id, signature_type, signature_data_url,
        signature_metadata, ip_address, device_info, is_verified,
        verification_method, blockchain_tx_id, biometric_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        signatureId,
        documentId,
        req.user.userId,
        signatureType,
        signatureResult.signatureDataUrl,
        JSON.stringify({
          ...metadata,
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          ...signatureResult.metadata
        }),
        req.ip,
        req.get('User-Agent'),
        signatureResult.verified || false,
        signatureResult.verificationMethod || 'SELF_SIGNED',
        null, // Will be updated after blockchain transaction
        signatureResult.biometricData ? JSON.stringify(signatureResult.biometricData) : null
      ]
    );

    const signature = insertResult.rows[0];

    // Update document state on blockchain
    try {
      const blockchainResult = await updateDocumentStateOnBlockchain(documentId, 'SIGNED', {
        signatureId,
        signatureType,
        signedBy: req.user.userId,
        signedAt: new Date().toISOString()
      });

      if (blockchainResult.success) {
        // Update signature with blockchain transaction ID
        await db.query(
          'UPDATE signatures SET blockchain_tx_id = $1 WHERE id = $2',
          [blockchainResult.transactionId, signatureId]
        );
      }
    } catch (blockchainError) {
      console.warn('Blockchain update failed:', blockchainError.message);
    }

    // Check if document has all required signatures
    const signatureCount = await db.query(
      'SELECT COUNT(*) as count FROM signatures WHERE document_id = $1',
      [documentId]
    );

    const totalSignatures = parseInt(signatureCount.rows[0].count);
    const requiredSignatures = document.signatures_required || 1;

    let documentStatus = 'SIGNED';
    if (totalSignatures >= requiredSignatures) {
      documentStatus = 'COMPLETED';
      
      // Update document status
      await db.query(
        'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [documentStatus, documentId]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Document signed successfully',
      data: {
        signature: {
          id: signature.id,
          documentId: signature.document_id,
          signatureType: signature.signature_type,
          isVerified: signature.is_verified,
          verificationMethod: signature.verification_method,
          blockchainTxId: signature.blockchain_tx_id,
          createdAt: signature.created_at
        },
        document: {
          id: documentId,
          status: documentStatus,
          totalSignatures,
          requiredSignatures
        }
      }
    });

  } catch (error) {
    console.error('Document signing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign document'
    });
  }
});

// Upload signature image (for drawn signatures)
router.post('/:documentId/upload-signature', authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { metadata } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No signature file uploaded'
      });
    }

    // Process the uploaded signature
    const signatureDataUrl = `/signatures/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Signature uploaded successfully',
      data: {
        signatureDataUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Signature upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload signature'
    });
  }
});

// Get signatures for a document
router.get('/:documentId', authenticateToken, async (req, res) => {
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

    // Get signatures for the document
    const result = await db.query(
      `SELECT s.*, u.name as signer_name, u.email as signer_email
       FROM signatures s
       JOIN users u ON s.user_id = u.id
       WHERE s.document_id = $1
       ORDER BY s.created_at DESC`,
      [documentId]
    );

    const signatures = result.rows.map(sig => ({
      id: sig.id,
      documentId: sig.document_id,
      signerId: sig.user_id,
      signerName: sig.signer_name,
      signerEmail: sig.signer_email,
      signatureType: sig.signature_type,
      signatureDataUrl: sig.signature_data_url,
      metadata: sig.signature_metadata,
      ipAddress: sig.ip_address,
      deviceInfo: sig.device_info,
      isVerified: sig.is_verified,
      verificationMethod: sig.verification_method,
      blockchainTxId: sig.blockchain_tx_id,
      createdAt: sig.created_at
    }));

    res.json({
      success: true,
      data: {
        documentId,
        signatures,
        count: signatures.length
      }
    });

  } catch (error) {
    console.error('Get signatures error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve signatures'
    });
  }
});

// Verify signature
router.post('/:signatureId/verify', authenticateToken, async (req, res) => {
  try {
    const { signatureId } = req.params;
    const db = getDB();

    // Get signature details
    const result = await db.query(
      `SELECT s.*, d.hash as document_hash, d.hash_algorithm
       FROM signatures s
       JOIN documents d ON s.document_id = d.id
       WHERE s.id = $1`,
      [signatureId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    const signature = result.rows[0];

    // Verify signature
    const verificationResult = await verifySignature({
      signatureId,
      signatureType: signature.signature_type,
      signatureData: signature.signature_data_url,
      documentHash: signature.document_hash,
      metadata: signature.signature_metadata
    });

    // Update verification status
    await db.query(
      'UPDATE signatures SET is_verified = $1, verification_method = $2 WHERE id = $3',
      [verificationResult.verified, verificationResult.method, signatureId]
    );

    res.json({
      success: true,
      message: verificationResult.verified ? 'Signature verified successfully' : 'Signature verification failed',
      data: {
        signatureId,
        verified: verificationResult.verified,
        verificationMethod: verificationResult.method,
        details: verificationResult.details,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify signature'
    });
  }
});

// Generate signing keys for user
router.post('/keys/generate', authenticateToken, [
  body('keyType').isIn(['RSA', 'ECDSA', 'EdDSA']).withMessage('Invalid key type'),
  body('keySize').optional().isInt({ min: 1024, max: 4096 }).withMessage('Invalid key size'),
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

    const { keyType = 'RSA', keySize = 2048 } = req.body;

    // Generate key pair
    const keyResult = await generateSigningKeys({
      userId: req.user.userId,
      keyType,
      keySize
    });

    if (!keyResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate keys',
        error: keyResult.error
      });
    }

    res.json({
      success: true,
      message: 'Signing keys generated successfully',
      data: {
        keyId: keyResult.keyId,
        keyType,
        keySize,
        publicKey: keyResult.publicKey,
        fingerprint: keyResult.fingerprint,
        createdAt: keyResult.createdAt
      }
    });

  } catch (error) {
    console.error('Key generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signing keys'
    });
  }
});

// Get user's signing keys
router.get('/keys', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, this would retrieve keys from a secure key store
    // For now, return mock data
    const mockKeys = [
      {
        keyId: 'key_' + Date.now(),
        keyType: 'RSA',
        keySize: 2048,
        fingerprint: 'SHA256:' + require('crypto').randomBytes(32).toString('hex'),
        createdAt: new Date().toISOString(),
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: {
        keys: mockKeys,
        count: mockKeys.length
      }
    });

  } catch (error) {
    console.error('Get keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve signing keys'
    });
  }
});

// Delete signature (only by document owner or signer)
router.delete('/:signatureId', authenticateToken, async (req, res) => {
  try {
    const { signatureId } = req.params;
    const db = getDB();

    // Check if user has permission to delete the signature
    const result = await db.query(
      `SELECT s.*, d.user_id as document_owner
       FROM signatures s
       JOIN documents d ON s.document_id = d.id
       WHERE s.id = $1`,
      [signatureId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    const signature = result.rows[0];

    // Only allow deletion by signature owner or document owner
    if (signature.user_id !== req.user.userId && signature.document_owner !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Soft delete the signature
    await db.query(
      'UPDATE signatures SET is_verified = FALSE WHERE id = $1',
      [signatureId]
    );

    res.json({
      success: true,
      message: 'Signature invalidated successfully'
    });

  } catch (error) {
    console.error('Delete signature error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete signature'
    });
  }
});

module.exports = router;
