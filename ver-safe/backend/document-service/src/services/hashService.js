const crypto = require('crypto');
const fs = require('fs');

/**
 * Hash Service for document integrity verification
 * Supports multiple hashing algorithms for enhanced security
 */

// Supported hash algorithms
const SUPPORTED_ALGORITHMS = {
  'SHA-256': 'sha256',
  'SHA-3': 'sha3-256',
  'BLAKE2': 'blake2b512'
};

/**
 * Generate hash for a document file
 * @param {string} filePath - Path to the document file
 * @param {string} algorithm - Hash algorithm to use (default: SHA-256)
 * @returns {Promise<Object>} Hash result with algorithm and hash value
 */
async function hashDocument(filePath, algorithm = 'SHA-256') {
  return new Promise((resolve, reject) => {
    try {
      if (!SUPPORTED_ALGORITHMS[algorithm]) {
        throw new Error(`Unsupported hash algorithm: ${algorithm}`);
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const hash = crypto.createHash(SUPPORTED_ALGORITHMS[algorithm]);
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('end', () => {
        const hashValue = hash.digest('hex');
        
        // Generate content hash (first 32 characters for metadata)
        const contentHash = hashValue.substring(0, 32);

        resolve({
          algorithm,
          hash: hashValue,
          contentHash,
          timestamp: new Date().toISOString()
        });
      });

      stream.on('error', (error) => {
        reject(new Error(`Failed to hash file: ${error.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Verify document hash against stored hash
 * @param {string} filePath - Path to the document file
 * @param {string} storedHash - Previously stored hash value
 * @param {string} algorithm - Hash algorithm used
 * @returns {Promise<Object>} Verification result
 */
async function verifyDocumentHash(filePath, storedHash, algorithm = 'SHA-256') {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        verified: false,
        message: 'File not found',
        error: 'FILE_NOT_FOUND'
      };
    }

    const hashResult = await hashDocument(filePath, algorithm);
    const verified = hashResult.hash === storedHash;

    return {
      verified,
      message: verified ? 'Hash verification successful' : 'Hash mismatch detected',
      currentHash: hashResult.hash,
      storedHash,
      algorithm,
      timestamp: new Date().toISOString(),
      ...(verified ? {} : { error: 'HASH_MISMATCH' })
    };

  } catch (error) {
    return {
      verified: false,
      message: `Hash verification failed: ${error.message}`,
      error: 'VERIFICATION_ERROR'
    };
  }
}

/**
 * Generate multiple hashes for enhanced security
 * @param {string} filePath - Path to the document file
 * @returns {Promise<Object>} Multiple hash results
 */
async function generateMultipleHashes(filePath) {
  try {
    const algorithms = Object.keys(SUPPORTED_ALGORITHMS);
    const hashes = {};

    for (const algorithm of algorithms) {
      const result = await hashDocument(filePath, algorithm);
      hashes[algorithm] = result.hash;
    }

    return {
      success: true,
      hashes,
      primary: hashes['SHA-256'], // Use SHA-256 as primary
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Hash text content (for signatures, metadata, etc.)
 * @param {string} content - Text content to hash
 * @param {string} algorithm - Hash algorithm to use
 * @returns {string} Hash value
 */
function hashText(content, algorithm = 'SHA-256') {
  if (!SUPPORTED_ALGORITHMS[algorithm]) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  const hash = crypto.createHash(SUPPORTED_ALGORITHMS[algorithm]);
  hash.update(content, 'utf8');
  return hash.digest('hex');
}

/**
 * Generate secure random salt
 * @param {number} length - Salt length in bytes (default: 32)
 * @returns {string} Random salt in hex format
 */
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash content with salt for additional security
 * @param {string} content - Content to hash
 * @param {string} salt - Salt value
 * @param {string} algorithm - Hash algorithm to use
 * @returns {string} Salted hash value
 */
function hashWithSalt(content, salt, algorithm = 'SHA-256') {
  if (!SUPPORTED_ALGORITHMS[algorithm]) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }

  const hash = crypto.createHash(SUPPORTED_ALGORITHMS[algorithm]);
  hash.update(content + salt, 'utf8');
  return hash.digest('hex');
}

/**
 * Verify file integrity using checksum
 * @param {string} filePath - Path to the file
 * @param {string} expectedChecksum - Expected checksum value
 * @param {string} algorithm - Hash algorithm to use
 * @returns {Promise<boolean>} True if file is intact
 */
async function verifyFileIntegrity(filePath, expectedChecksum, algorithm = 'SHA-256') {
  try {
    const result = await hashDocument(filePath, algorithm);
    return result.hash === expectedChecksum;
  } catch (error) {
    console.error('File integrity verification failed:', error);
    return false;
  }
}

/**
 * Calculate file fingerprint (combination of size, modified time, and hash)
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} File fingerprint
 */
async function calculateFileFingerprint(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const hashResult = await hashDocument(filePath);

    return {
      size: stats.size,
      modified: stats.mtime.toISOString(),
      hash: hashResult.hash,
      algorithm: hashResult.algorithm,
      fingerprint: hashText(`${stats.size}-${stats.mtime.getTime()}-${hashResult.hash}`),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to calculate file fingerprint: ${error.message}`);
  }
}

module.exports = {
  hashDocument,
  verifyDocumentHash,
  generateMultipleHashes,
  hashText,
  generateSalt,
  hashWithSalt,
  verifyFileIntegrity,
  calculateFileFingerprint,
  SUPPORTED_ALGORITHMS
};
