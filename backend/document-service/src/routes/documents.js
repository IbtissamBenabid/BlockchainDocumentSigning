const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { getDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { hashDocument } = require('../services/hashService');
const { registerOnBlockchain } = require('../services/blockchainService');
const axios = require('axios');
const FormData = require('form-data');
const { extractDocumentMetadata } = require('../services/documentProcessor');

const router = express.Router();

// Rate limiting for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per windowMs
  message: 'Too many upload attempts, please try again later.',
});

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8500';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'versafe-internal-api-key-2024';

/**
 * Scan document with AI service for malware detection
 */
async function scanDocumentWithAI(filePath, documentId = null) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    if (documentId) {
      formData.append('document_id', documentId);
    }

    const response = await axios.post(`${AI_SERVICE_URL}/api/ai/scan-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': INTERNAL_API_KEY
      },
      timeout: 30000 // 30 second timeout
    });

    return response.data;
  } catch (error) {
    console.error('AI scan error:', error.message);
    // Return a default safe result if AI service is unavailable
    return {
      success: false,
      result: 'UNKNOWN',
      confidence: 0,
      error: error.message
    };
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Single file upload
  }
});

// Upload document endpoint
router.post('/upload', uploadLimiter, authenticateToken, upload.single('document'), [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
  body('securityLevel').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid security level'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, securityLevel = 'MEDIUM' } = req.body;
    const db = getDB();

    // Generate document hash
    const hashResult = await hashDocument(req.file.path);
    
    // Extract document metadata
    const metadata = await extractDocumentMetadata(req.file.path, req.file.mimetype);

    // AI Malware Scan for PDF files
    let aiScanResult = null;
    if (req.file.mimetype === 'application/pdf') {
      console.log('Scanning PDF with AI service...');
      aiScanResult = await scanDocumentWithAI(req.file.path);

      // If malware detected, reject the upload
      if (aiScanResult.success && aiScanResult.result === 'Malicious') {
        // Delete the uploaded file
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          success: false,
          message: 'Document upload rejected: Security threat detected',
          error: 'MALWARE_DETECTED',
          aiAnalysis: {
            result: aiScanResult.result,
            confidence: aiScanResult.confidence,
            riskScore: aiScanResult.risk_score,
            timestamp: aiScanResult.analysis_timestamp
          }
        });
      }
    }

    // Register on blockchain
    const blockchainResult = await registerOnBlockchain({
      hash: hashResult.hash,
      algorithm: hashResult.algorithm,
      userId: req.user.userId,
      fileName: req.file.originalname
    });

    // Insert document record
    const documentId = uuidv4();
    const result = await db.query(
      `INSERT INTO documents (
        id, user_id, title, file_name, file_type, file_size, file_path,
        hash, hash_algorithm, blockchain_tx_id, blockchain_network,
        security_level, page_count, content_hash, signatures_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        documentId,
        req.user.userId,
        title || req.file.originalname,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.path,
        hashResult.hash,
        hashResult.algorithm,
        blockchainResult.transactionId,
        blockchainResult.network,
        securityLevel,
        metadata.pageCount,
        hashResult.contentHash,
        securityLevel === 'CRITICAL' ? 2 : 1
      ]
    );

    const document = result.rows[0];

    // Insert metadata
    if (metadata.extractedData) {
      for (const [key, value] of Object.entries(metadata.extractedData)) {
        await db.query(
          'INSERT INTO document_metadata (document_id, key, value) VALUES ($1, $2, $3)',
          [documentId, key, JSON.stringify(value)]
        );
      }
    }

    // Note: Verification will be done manually after signing
    // No automatic verification during upload

    // Prepare response with AI analysis if available
    const responseData = {
      document: {
        id: document.id,
        title: document.title,
        fileName: document.file_name,
        fileType: document.file_type,
        fileSize: document.file_size,
        status: document.status,
        securityLevel: document.security_level,
        hash: document.hash,
        hashAlgorithm: document.hash_algorithm,
        blockchainTxId: document.blockchain_tx_id,
        blockchainNetwork: document.blockchain_network,
        pageCount: document.page_count,
        signaturesRequired: document.signatures_required,
        createdAt: document.created_at
      },
      blockchain: blockchainResult
    };

    // Add AI analysis results if available
    if (aiScanResult && aiScanResult.success) {
      responseData.aiAnalysis = {
        result: aiScanResult.result,
        confidence: aiScanResult.confidence,
        riskScore: aiScanResult.risk_score,
        featuresAnalyzed: aiScanResult.features_analyzed,
        timestamp: aiScanResult.analysis_timestamp,
        modelVersion: aiScanResult.model_version
      };
    }

    res.status(201).json({
      success: true,
      message: aiScanResult && aiScanResult.success
        ? `Document uploaded successfully. AI Security Scan: ${aiScanResult.result} (${aiScanResult.risk_score}% risk)`
        : 'Document uploaded successfully',
      data: responseData
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// Get user's documents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, securityLevel } = req.query;
    const offset = (page - 1) * limit;
    const db = getDB();

    // Build query with filters
    let query = `
      SELECT d.*, 
             COUNT(s.id) as signature_count,
             COUNT(ds.id) as share_count
      FROM documents d
      LEFT JOIN signatures s ON d.id = s.document_id
      LEFT JOIN document_shares ds ON d.id = ds.document_id
      WHERE d.user_id = $1 AND d.is_revoked = FALSE
    `;
    
    const params = [req.user.userId];
    let paramCount = 2;

    if (status) {
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (securityLevel) {
      query += ` AND d.security_level = $${paramCount}`;
      params.push(securityLevel);
      paramCount++;
    }

    query += `
      GROUP BY d.id
      ORDER BY d.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM documents WHERE user_id = $1 AND is_revoked = FALSE';
    const countParams = [req.user.userId];
    let countParamCount = 2;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (securityLevel) {
      countQuery += ` AND security_level = $${countParamCount}`;
      countParams.push(securityLevel);
    }

    const countResult = await db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    const documents = result.rows.map(doc => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      status: doc.status,
      securityLevel: doc.security_level,
      hash: doc.hash,
      hashAlgorithm: doc.hash_algorithm,
      blockchainTxId: doc.blockchain_tx_id,
      blockchainNetwork: doc.blockchain_network,
      pageCount: doc.page_count,
      signaturesRequired: doc.signatures_required,
      signatureCount: parseInt(doc.signature_count),
      shareCount: parseInt(doc.share_count),
      expiryDate: doc.expiry_date,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    }));

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents'
    });
  }
});

// Get document by ID
router.get('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    const result = await db.query(
      `SELECT d.*,
              array_agg(DISTINCT jsonb_build_object(
                'id', s.id,
                'userId', s.user_id,
                'signatureType', s.signature_type,
                'isVerified', s.is_verified,
                'createdAt', s.created_at
              )) FILTER (WHERE s.id IS NOT NULL) as signatures,
              array_agg(DISTINCT jsonb_build_object(
                'email', ds.shared_with_email,
                'accessLevel', ds.access_level,
                'createdAt', ds.created_at
              )) FILTER (WHERE ds.id IS NOT NULL) as shares
       FROM documents d
       LEFT JOIN signatures s ON d.id = s.document_id
       LEFT JOIN document_shares ds ON d.id = ds.document_id
       WHERE d.id = $1 AND (d.user_id = $2 OR ds.shared_with_user_id = $2)
       GROUP BY d.id`,
      [documentId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const doc = result.rows[0];

    // Get verification history
    const verificationResult = await db.query(
      `SELECT * FROM verification_history
       WHERE document_id = $1
       ORDER BY created_at DESC`,
      [documentId]
    );

    // Get metadata
    const metadataResult = await db.query(
      'SELECT key, value FROM document_metadata WHERE document_id = $1',
      [documentId]
    );

    const metadata = {};
    metadataResult.rows.forEach(row => {
      try {
        metadata[row.key] = JSON.parse(row.value);
      } catch {
        metadata[row.key] = row.value;
      }
    });

    const document = {
      id: doc.id,
      title: doc.title,
      fileName: doc.file_name,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      status: doc.status,
      securityLevel: doc.security_level,
      hash: doc.hash,
      hashAlgorithm: doc.hash_algorithm,
      blockchainTxId: doc.blockchain_tx_id,
      blockchainNetwork: doc.blockchain_network,
      pageCount: doc.page_count,
      signaturesRequired: doc.signatures_required,
      signatures: doc.signatures || [],
      shares: doc.shares || [],
      verificationHistory: verificationResult.rows,
      metadata,
      expiryDate: doc.expiry_date,
      isRevoked: doc.is_revoked,
      revokedReason: doc.revoked_reason,
      revokedAt: doc.revoked_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at
    };

    res.json({
      success: true,
      data: { document }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document'
    });
  }
});

// Update document
router.put('/:documentId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
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

    const { documentId } = req.params;
    const { title, expiryDate } = req.body;
    const db = getDB();

    // Check if user owns the document
    const checkResult = await db.query(
      'SELECT id FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (expiryDate) {
      updates.push(`expiry_date = $${paramCount}`);
      values.push(expiryDate);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(documentId);

    const query = `
      UPDATE documents
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    const document = result.rows[0];

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: {
          id: document.id,
          title: document.title,
          fileName: document.file_name,
          fileType: document.file_type,
          status: document.status,
          expiryDate: document.expiry_date,
          updatedAt: document.updated_at
        }
      }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
});

// Delete document (soft delete)
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    // Check if user owns the document
    const checkResult = await db.query(
      'SELECT id, file_path FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const document = checkResult.rows[0];

    // Soft delete the document
    await db.query(
      'UPDATE documents SET is_revoked = TRUE, revoked_reason = $1, revoked_at = CURRENT_TIMESTAMP, revoked_by = $2 WHERE id = $3',
      ['Deleted by user', req.user.userId, documentId]
    );

    // Optionally delete the physical file
    if (process.env.DELETE_FILES_ON_REMOVE === 'true' && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// Get AI analysis for a document
router.get('/:documentId/ai-analysis', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    // Check if user has access to the document
    const documentResult = await db.query(
      'SELECT id, file_path, file_type FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const document = documentResult.rows[0];

    // Check if it's a PDF file
    if (document.file_type !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'AI analysis is only available for PDF documents'
      });
    }

    // Get existing AI analysis from database
    const analysisResult = await db.query(
      `SELECT * FROM ai_analysis
       WHERE document_id = $1
       ORDER BY analysis_timestamp DESC
       LIMIT 1`,
      [documentId]
    );

    if (analysisResult.rows.length > 0) {
      const analysis = analysisResult.rows[0];
      return res.json({
        success: true,
        data: {
          documentId,
          result: analysis.result,
          confidence: parseFloat(analysis.confidence_score),
          riskScore: Math.round(parseFloat(analysis.confidence_score) * 100),
          analysisType: analysis.analysis_type,
          modelVersion: analysis.model_version,
          timestamp: analysis.analysis_timestamp,
          features: analysis.features_extracted ? JSON.parse(analysis.features_extracted) : null
        }
      });
    }

    // If no existing analysis, perform new analysis
    const aiResult = await scanDocumentWithAI(document.file_path, documentId);

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to perform AI analysis',
        error: aiResult.error
      });
    }

    res.json({
      success: true,
      data: {
        documentId,
        result: aiResult.result,
        confidence: aiResult.confidence,
        riskScore: aiResult.risk_score,
        featuresAnalyzed: aiResult.features_analyzed,
        modelVersion: aiResult.model_version,
        timestamp: aiResult.analysis_timestamp
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI analysis'
    });
  }
});

// Trigger new AI analysis for a document
router.post('/:documentId/ai-analysis', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const db = getDB();

    // Check if user has access to the document
    const documentResult = await db.query(
      'SELECT id, file_path, file_type FROM documents WHERE id = $1 AND user_id = $2',
      [documentId, req.user.userId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or access denied'
      });
    }

    const document = documentResult.rows[0];

    // Check if it's a PDF file
    if (document.file_type !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'AI analysis is only available for PDF documents'
      });
    }

    // Perform AI analysis
    const aiResult = await scanDocumentWithAI(document.file_path, documentId);

    if (!aiResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to perform AI analysis',
        error: aiResult.error
      });
    }

    res.json({
      success: true,
      message: 'AI analysis completed successfully',
      data: {
        documentId,
        result: aiResult.result,
        confidence: aiResult.confidence,
        riskScore: aiResult.risk_score,
        featuresAnalyzed: aiResult.features_analyzed,
        modelVersion: aiResult.model_version,
        timestamp: aiResult.analysis_timestamp
      }
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform AI analysis'
    });
  }
});

module.exports = router;
