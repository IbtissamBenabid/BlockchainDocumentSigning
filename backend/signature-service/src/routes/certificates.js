const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const forge = require('node-forge');

const router = express.Router();

// Generate digital certificate for user
router.post('/generate', authenticateToken, [
  body('commonName').optional().isString().withMessage('Common name must be a string'),
  body('organization').optional().isString().withMessage('Organization must be a string'),
  body('country').optional().isLength({ min: 2, max: 2 }).withMessage('Country must be 2 characters'),
  body('validityDays').optional().isInt({ min: 1, max: 3650 }).withMessage('Validity days must be between 1 and 3650'),
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

    const {
      commonName = req.user.name,
      organization = 'VerSafe User',
      country = 'US',
      validityDays = 365
    } = req.body;

    // Generate key pair
    const keyPair = forge.pki.rsa.generateKeyPair(2048);

    // Create certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keyPair.publicKey;
    cert.serialNumber = '01' + crypto.randomBytes(8).toString('hex');
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + validityDays);

    // Set subject
    const attrs = [
      { name: 'commonName', value: commonName },
      { name: 'organizationName', value: organization },
      { name: 'countryName', value: country },
      { name: 'emailAddress', value: req.user.email }
    ];
    cert.setSubject(attrs);

    // Set issuer (self-signed for now)
    cert.setIssuer(attrs);

    // Add extensions
    cert.setExtensions([
      {
        name: 'basicConstraints',
        cA: false
      },
      {
        name: 'keyUsage',
        keyCertSign: false,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: false,
        dataEncipherment: false
      },
      {
        name: 'extKeyUsage',
        serverAuth: false,
        clientAuth: true,
        codeSigning: false,
        emailProtection: true,
        timeStamping: false
      },
      {
        name: 'subjectAltName',
        altNames: [{
          type: 1, // email
          value: req.user.email
        }]
      }
    ]);

    // Sign certificate
    cert.sign(keyPair.privateKey, forge.md.sha256.create());

    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    const privateKeyPem = forge.pki.privateKeyToPem(keyPair.privateKey);
    const publicKeyPem = forge.pki.publicKeyToPem(keyPair.publicKey);

    // Generate fingerprint
    const fingerprint = forge.md.sha256.create();
    fingerprint.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());

    const certificateData = {
      id: `cert_${req.user.userId}_${Date.now()}`,
      userId: req.user.userId,
      commonName,
      organization,
      country,
      serialNumber: cert.serialNumber,
      fingerprint: fingerprint.digest().toHex(),
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      certificate: certPem,
      publicKey: publicKeyPem,
      algorithm: 'RSA',
      keySize: 2048,
      createdAt: new Date().toISOString()
    };

    // In production, store the certificate and private key securely
    // For now, just return the certificate data (without private key)
    res.status(201).json({
      success: true,
      message: 'Digital certificate generated successfully',
      data: {
        certificate: {
          id: certificateData.id,
          commonName: certificateData.commonName,
          organization: certificateData.organization,
          country: certificateData.country,
          serialNumber: certificateData.serialNumber,
          fingerprint: certificateData.fingerprint,
          validFrom: certificateData.validFrom,
          validTo: certificateData.validTo,
          algorithm: certificateData.algorithm,
          keySize: certificateData.keySize,
          createdAt: certificateData.createdAt
        },
        certificatePem: certPem,
        publicKeyPem: publicKeyPem
        // Note: Private key is not returned for security reasons
      }
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate'
    });
  }
});

// Get user's certificates
router.get('/', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, this would retrieve certificates from a secure store
    // For now, return mock data
    const mockCertificates = [
      {
        id: `cert_${req.user.userId}_${Date.now()}`,
        commonName: req.user.name,
        organization: 'VerSafe User',
        country: 'US',
        serialNumber: '01' + crypto.randomBytes(8).toString('hex'),
        fingerprint: crypto.randomBytes(32).toString('hex'),
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        algorithm: 'RSA',
        keySize: 2048,
        status: 'ACTIVE',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        certificates: mockCertificates,
        count: mockCertificates.length
      }
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificates'
    });
  }
});

// Get certificate by ID
router.get('/:certificateId', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;

    // In a real implementation, retrieve from secure certificate store
    // For now, return mock data
    const mockCertificate = {
      id: certificateId,
      commonName: req.user.name,
      organization: 'VerSafe User',
      country: 'US',
      serialNumber: '01' + crypto.randomBytes(8).toString('hex'),
      fingerprint: crypto.randomBytes(32).toString('hex'),
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      algorithm: 'RSA',
      keySize: 2048,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: {
        certificate: mockCertificate
      }
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate'
    });
  }
});

// Verify certificate
router.post('/:certificateId/verify', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;

    // In a real implementation, verify certificate against CA and CRL
    // For now, simulate verification
    const verified = Math.random() > 0.05; // 95% success rate

    const verificationResult = {
      certificateId,
      verified,
      status: verified ? 'VALID' : 'INVALID',
      checks: {
        signatureValid: verified,
        notExpired: verified,
        notRevoked: verified,
        chainValid: verified
      },
      verifiedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: verified ? 'Certificate is valid' : 'Certificate verification failed',
      data: verificationResult
    });

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate'
    });
  }
});

// Revoke certificate
router.post('/:certificateId/revoke', authenticateToken, [
  body('reason').optional().isIn(['UNSPECIFIED', 'KEY_COMPROMISE', 'CA_COMPROMISE', 'AFFILIATION_CHANGED', 'SUPERSEDED', 'CESSATION_OF_OPERATION']).withMessage('Invalid revocation reason'),
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

    const { certificateId } = req.params;
    const { reason = 'UNSPECIFIED' } = req.body;

    // In a real implementation, add to Certificate Revocation List (CRL)
    // For now, just simulate revocation
    const revocationResult = {
      certificateId,
      revoked: true,
      reason,
      revokedAt: new Date().toISOString(),
      revokedBy: req.user.userId
    };

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      data: revocationResult
    });

  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke certificate'
    });
  }
});

module.exports = router;
