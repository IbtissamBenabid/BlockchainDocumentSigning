const crypto = require('crypto');
const forge = require('node-forge');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Signature Service for creating and verifying different types of signatures
 */

// Signature types
const SIGNATURE_TYPES = {
  ELECTRONIC: 'ELECTRONIC',
  DIGITAL: 'DIGITAL',
  BIOMETRIC: 'BIOMETRIC',
  DRAWN: 'DRAWN',
  TYPED: 'TYPED'
};

/**
 * Create electronic signature
 * @param {Object} params - Signature parameters
 * @returns {Promise<Object>} Signature result
 */
async function createElectronicSignature(params) {
  try {
    const { signatureId, documentId, userId, signatureData, metadata } = params;

    // Generate signature hash
    const signatureHash = crypto.createHash('sha256')
      .update(`${documentId}:${userId}:${Date.now()}`)
      .digest('hex');

    // Create signature data URL (base64 encoded)
    let signatureDataUrl;
    
    if (signatureData) {
      // If signature data is provided (drawn/typed signature)
      if (signatureData.startsWith('data:')) {
        signatureDataUrl = signatureData;
      } else {
        // Convert text to signature image
        signatureDataUrl = await createTextSignature(signatureData, metadata);
      }
    } else {
      // Generate default electronic signature
      signatureDataUrl = await createDefaultSignature(userId, metadata);
    }

    return {
      success: true,
      signatureId,
      signatureDataUrl,
      signatureHash,
      verified: true,
      verificationMethod: 'ELECTRONIC_SIGNATURE',
      metadata: {
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        type: 'ELECTRONIC'
      }
    };

  } catch (error) {
    console.error('Electronic signature creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create digital signature using cryptographic keys
 * @param {Object} params - Signature parameters
 * @returns {Promise<Object>} Signature result
 */
async function createDigitalSignature(params) {
  try {
    const { signatureId, documentId, userId, documentHash, metadata } = params;

    // Generate or retrieve user's key pair
    const keyPair = await getUserKeyPair(userId);
    
    // Create signature data to sign
    const dataToSign = `${documentId}:${documentHash}:${userId}:${Date.now()}`;
    
    // Create digital signature
    const signature = crypto.sign('sha256', Buffer.from(dataToSign), {
      key: keyPair.privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });

    // Create certificate info
    const certificate = {
      subject: `CN=${userId}`,
      issuer: 'VerSafe CA',
      serialNumber: crypto.randomBytes(16).toString('hex'),
      validFrom: new Date().toISOString(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      publicKey: keyPair.publicKey,
      algorithm: 'RSA-PSS'
    };

    // Store signature data
    const signatureDataUrl = `data:application/pkcs7-signature;base64,${signature.toString('base64')}`;

    return {
      success: true,
      signatureId,
      signatureDataUrl,
      signature: signature.toString('base64'),
      certificate,
      verified: true,
      verificationMethod: 'DIGITAL_CERTIFICATE',
      metadata: {
        algorithm: 'RSA-PSS',
        hashAlgorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        type: 'DIGITAL',
        certificate
      }
    };

  } catch (error) {
    console.error('Digital signature creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create biometric signature
 * @param {Object} params - Signature parameters
 * @returns {Promise<Object>} Signature result
 */
async function createBiometricSignature(params) {
  try {
    const { signatureId, documentId, userId, biometricData, metadata } = params;

    // Process biometric data (in a real implementation, this would involve
    // sophisticated biometric analysis)
    const processedBiometrics = await processBiometricData(biometricData);

    // Generate biometric signature hash
    const biometricHash = crypto.createHash('sha256')
      .update(JSON.stringify(processedBiometrics))
      .digest('hex');

    // Create visual representation of biometric signature
    const signatureDataUrl = await createBiometricSignatureImage(processedBiometrics, metadata);

    return {
      success: true,
      signatureId,
      signatureDataUrl,
      biometricHash,
      biometricData: processedBiometrics,
      verified: true,
      verificationMethod: 'BIOMETRIC_ANALYSIS',
      metadata: {
        algorithm: 'BIOMETRIC_HASH',
        timestamp: new Date().toISOString(),
        type: 'BIOMETRIC',
        confidence: processedBiometrics.confidence || 0.95
      }
    };

  } catch (error) {
    console.error('Biometric signature creation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify signature
 * @param {Object} params - Verification parameters
 * @returns {Promise<Object>} Verification result
 */
async function verifySignature(params) {
  try {
    const { signatureId, signatureType, signatureData, documentHash, metadata } = params;

    let verified = false;
    let method = 'UNKNOWN';
    let details = {};

    switch (signatureType) {
      case SIGNATURE_TYPES.ELECTRONIC:
      case SIGNATURE_TYPES.DRAWN:
      case SIGNATURE_TYPES.TYPED:
        verified = await verifyElectronicSignature(signatureData, metadata);
        method = 'ELECTRONIC_VERIFICATION';
        break;

      case SIGNATURE_TYPES.DIGITAL:
        const digitalResult = await verifyDigitalSignature(signatureData, documentHash, metadata);
        verified = digitalResult.verified;
        method = 'DIGITAL_CERTIFICATE_VERIFICATION';
        details = digitalResult.details;
        break;

      case SIGNATURE_TYPES.BIOMETRIC:
        const biometricResult = await verifyBiometricSignature(signatureData, metadata);
        verified = biometricResult.verified;
        method = 'BIOMETRIC_VERIFICATION';
        details = biometricResult.details;
        break;

      default:
        throw new Error(`Unsupported signature type: ${signatureType}`);
    }

    return {
      verified,
      method,
      details,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Signature verification error:', error);
    return {
      verified: false,
      method: 'ERROR',
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate signing keys for user
 * @param {Object} params - Key generation parameters
 * @returns {Promise<Object>} Key generation result
 */
async function generateSigningKeys(params) {
  try {
    const { userId, keyType = 'RSA', keySize = 2048 } = params;

    let keyPair;
    
    switch (keyType) {
      case 'RSA':
        keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: keySize,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        break;

      case 'ECDSA':
        keyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: 'secp256k1',
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        break;

      case 'EdDSA':
        keyPair = crypto.generateKeyPairSync('ed25519', {
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        break;

      default:
        throw new Error(`Unsupported key type: ${keyType}`);
    }

    // Generate key fingerprint
    const fingerprint = crypto.createHash('sha256')
      .update(keyPair.publicKey)
      .digest('hex');

    const keyId = `key_${userId}_${Date.now()}`;

    // Store keys securely (in production, use HSM or secure key storage)
    await storeUserKeys(userId, keyId, keyPair, keyType);

    return {
      success: true,
      keyId,
      publicKey: keyPair.publicKey,
      fingerprint: `SHA256:${fingerprint}`,
      keyType,
      keySize,
      createdAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Key generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper functions

async function createTextSignature(text, metadata) {
  const canvas = createCanvas(400, 100);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 400, 100);

  // Set text style
  ctx.fillStyle = 'black';
  ctx.font = '24px cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw signature text
  ctx.fillText(text, 200, 50);

  return canvas.toDataURL();
}

async function createDefaultSignature(userId, metadata) {
  const canvas = createCanvas(300, 80);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, 300, 80);

  // Set text style
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw signature placeholder
  ctx.fillText('Electronic Signature', 150, 30);
  ctx.font = '12px Arial';
  ctx.fillText(`User: ${userId}`, 150, 50);
  ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 150, 65);

  return canvas.toDataURL();
}

async function createBiometricSignatureImage(biometricData, metadata) {
  const canvas = createCanvas(350, 120);
  const ctx = canvas.getContext('2d');

  // Set background
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(0, 0, 350, 120);

  // Set text style
  ctx.fillStyle = '#1976d2';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw biometric signature info
  ctx.fillText('Biometric Signature', 175, 30);
  ctx.font = '14px Arial';
  ctx.fillText(`Confidence: ${(biometricData.confidence * 100).toFixed(1)}%`, 175, 55);
  ctx.fillText(`Type: ${biometricData.type || 'Fingerprint'}`, 175, 75);
  ctx.fillText(`Verified: ${new Date().toLocaleString()}`, 175, 95);

  return canvas.toDataURL();
}

async function processBiometricData(biometricData) {
  // In a real implementation, this would involve sophisticated biometric processing
  // For now, simulate biometric processing
  return {
    type: 'fingerprint',
    confidence: 0.95 + Math.random() * 0.05, // 95-100% confidence
    features: crypto.randomBytes(32).toString('hex'),
    timestamp: new Date().toISOString()
  };
}

async function getUserKeyPair(userId) {
  // In a real implementation, retrieve from secure key storage
  // For now, generate a temporary key pair
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
}

async function storeUserKeys(userId, keyId, keyPair, keyType) {
  // In production, store in HSM or secure key management system
  // For now, just log the key storage
  console.log(`Storing ${keyType} key pair for user ${userId} with ID ${keyId}`);
}

async function verifyElectronicSignature(signatureData, metadata) {
  // Basic verification for electronic signatures
  return signatureData && signatureData.length > 0;
}

async function verifyDigitalSignature(signatureData, documentHash, metadata) {
  try {
    // In a real implementation, verify the digital signature against the certificate
    // For now, simulate verification
    return {
      verified: Math.random() > 0.05, // 95% success rate
      details: {
        algorithm: 'RSA-PSS',
        certificateValid: true,
        timestampValid: true
      }
    };
  } catch (error) {
    return {
      verified: false,
      details: { error: error.message }
    };
  }
}

async function verifyBiometricSignature(signatureData, metadata) {
  try {
    // In a real implementation, verify biometric data
    // For now, simulate verification
    return {
      verified: Math.random() > 0.02, // 98% success rate
      details: {
        confidence: 0.97,
        matchScore: 0.95
      }
    };
  } catch (error) {
    return {
      verified: false,
      details: { error: error.message }
    };
  }
}

module.exports = {
  createElectronicSignature,
  createDigitalSignature,
  createBiometricSignature,
  verifySignature,
  generateSigningKeys,
  SIGNATURE_TYPES
};
