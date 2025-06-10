const axios = require('axios');

/**
 * Blockchain Integration Service for Signature Service
 * Communicates with the blockchain service to update document states
 */

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3006';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * Update document state on blockchain after signature
 * @param {string} documentId - Document ID
 * @param {string} newState - New document state
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Update result
 */
async function updateDocumentStateOnBlockchain(documentId, newState, metadata = {}) {
  try {
    const response = await axios.put(
      `${BLOCKCHAIN_SERVICE_URL}/api/blockchain/state`,
      {
        documentId,
        newState,
        metadata: {
          ...metadata,
          updatedBy: 'signature-service',
          timestamp: new Date().toISOString()
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTERNAL_API_KEY
        },
        timeout: 10000
      }
    );

    if (response.data.success) {
      return {
        success: true,
        transactionId: response.data.data.transactionId,
        blockNumber: response.data.data.blockNumber,
        timestamp: response.data.data.timestamp
      };
    } else {
      throw new Error(response.data.message || 'Blockchain update failed');
    }

  } catch (error) {
    console.error('Blockchain state update error:', error.message);
    
    // Return failure but don't throw - signature should still be recorded
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Register signature on blockchain
 * @param {Object} signatureData - Signature data
 * @returns {Promise<Object>} Registration result
 */
async function registerSignatureOnBlockchain(signatureData) {
  try {
    const { signatureId, documentId, userId, signatureType, signatureHash } = signatureData;

    const response = await axios.post(
      `${BLOCKCHAIN_SERVICE_URL}/api/blockchain/register`,
      {
        documentId: `SIG_${signatureId}`,
        hash: signatureHash,
        algorithm: 'SHA-256',
        userId,
        fileName: `signature_${signatureType.toLowerCase()}.sig`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTERNAL_API_KEY
        },
        timeout: 10000
      }
    );

    if (response.data.success) {
      return {
        success: true,
        transactionId: response.data.data.transactionId,
        blockNumber: response.data.data.blockNumber,
        network: response.data.data.network,
        timestamp: response.data.data.timestamp
      };
    } else {
      throw new Error(response.data.message || 'Blockchain registration failed');
    }

  } catch (error) {
    console.error('Blockchain signature registration error:', error.message);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Verify signature on blockchain
 * @param {string} signatureId - Signature ID
 * @returns {Promise<Object>} Verification result
 */
async function verifySignatureOnBlockchain(signatureId) {
  try {
    const response = await axios.post(
      `${BLOCKCHAIN_SERVICE_URL}/api/blockchain/verify`,
      {
        documentId: `SIG_${signatureId}`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': INTERNAL_API_KEY
        },
        timeout: 10000
      }
    );

    if (response.data.success) {
      return {
        success: true,
        verified: response.data.data.verified,
        network: response.data.data.network,
        timestamp: response.data.data.timestamp
      };
    } else {
      throw new Error(response.data.message || 'Blockchain verification failed');
    }

  } catch (error) {
    console.error('Blockchain signature verification error:', error.message);
    
    return {
      success: false,
      verified: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get signature history from blockchain
 * @param {string} signatureId - Signature ID
 * @returns {Promise<Object>} History result
 */
async function getSignatureHistoryFromBlockchain(signatureId) {
  try {
    const response = await axios.get(
      `${BLOCKCHAIN_SERVICE_URL}/api/blockchain/history/SIG_${signatureId}`,
      {
        headers: {
          'X-API-Key': INTERNAL_API_KEY
        },
        timeout: 10000
      }
    );

    if (response.data.success) {
      return {
        success: true,
        history: response.data.data.history,
        network: response.data.data.network,
        timestamp: response.data.data.timestamp
      };
    } else {
      throw new Error(response.data.message || 'Failed to get blockchain history');
    }

  } catch (error) {
    console.error('Blockchain history retrieval error:', error.message);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check blockchain service health
 * @returns {Promise<boolean>} Service health status
 */
async function checkBlockchainServiceHealth() {
  try {
    const response = await axios.get(
      `${BLOCKCHAIN_SERVICE_URL}/health`,
      { timeout: 5000 }
    );

    return response.status === 200 && response.data.status === 'healthy';

  } catch (error) {
    console.warn('Blockchain service health check failed:', error.message);
    return false;
  }
}

module.exports = {
  updateDocumentStateOnBlockchain,
  registerSignatureOnBlockchain,
  verifySignatureOnBlockchain,
  getSignatureHistoryFromBlockchain,
  checkBlockchainServiceHealth
};
