const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Service URLs
const SERVICES = {
  auth: 'http://localhost:3001',
  document: 'http://localhost:3002',
  signature: 'http://localhost:3003',
  email: 'http://localhost:3004',
  profile: 'http://localhost:3005',
  blockchain: 'http://localhost:3006',
  nginx: 'http://localhost:80'
};

// Test configuration
const TEST_CONFIG = {
  testUser: {
    email: 'test@versafe.com',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  apiKey: 'versafe-internal-api-key-2024', // Default internal API key
  timeout: 10000 // 10 seconds timeout
};

// Global variables for test data
let authToken = null;
let refreshToken = null;
let testUserId = null;
let testDocumentId = null;
let testSignatureId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logSection(message) {
  log(`\n${colors.bright}=== ${message} ===${colors.reset}`, colors.cyan);
}

// HTTP client with timeout
const httpClient = axios.create({
  timeout: TEST_CONFIG.timeout,
  validateStatus: () => true // Don't throw on HTTP error status codes
});

// Test helper functions
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      if (data instanceof FormData) {
        config.data = data;
        delete config.headers['Content-Type']; // Let axios set the boundary
      } else {
        config.data = data;
      }
    }

    const response = await httpClient(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null
    };
  }
}

async function testServiceHealth(serviceName, url) {
  logInfo(`Testing ${serviceName} service health...`);

  const healthEndpoints = ['/health', '/api/health', '/api/status', '/status', '/'];
  let isHealthy = false;
  let lastError = null;

  for (const endpoint of healthEndpoints) {
    const response = await makeRequest('GET', `${url}${endpoint}`);
    if (response.status === 200) {
      logSuccess(`${serviceName} service is healthy (${endpoint})`);
      isHealthy = true;
      break;
    } else if (response.status > 0) {
      lastError = `${endpoint}: ${response.status}`;
    } else {
      lastError = `${endpoint}: ${response.error}`;
    }
  }

  if (!isHealthy) {
    logError(`${serviceName} service is not responding (last error: ${lastError})`);
  }

  return isHealthy;
}

// Create a test file for document upload
function createTestFile() {
  const testContent = `
# Test Document for VerSafe

This is a test document created for testing the VerSafe document management system.

## Document Information
- Created: ${new Date().toISOString()}
- Purpose: Service testing
- Content: Sample text for hash generation

## Test Data
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Security Features
- Document hashing
- Blockchain registration
- Digital signatures
- Audit logging

This document will be used to test:
1. Document upload functionality
2. Hash generation and verification
3. Blockchain integration
4. Digital signature capabilities
5. Email notifications
  `;

  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

// Authentication Service Tests
async function testAuthService() {
  logSection('Testing Authentication Service');

  // Test service health
  const isHealthy = await testServiceHealth('Auth', SERVICES.auth);
  if (!isHealthy) return false;

  // Test user registration
  logInfo('Testing user registration...');
  const registerResponse = await makeRequest('POST', `${SERVICES.auth}/api/auth/register`, {
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password,
    name: TEST_CONFIG.testUser.name
  });

  if (registerResponse.status === 201 || registerResponse.status === 409) {
    if (registerResponse.status === 201) {
      logSuccess('User registration successful');
      testUserId = registerResponse.data?.data?.user?.id;
    } else {
      logWarning('User already exists (expected for repeated tests)');
    }
  } else {
    logError(`User registration failed: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);
    return false;
  }

  // Test user login
  logInfo('Testing user login...');
  const loginResponse = await makeRequest('POST', `${SERVICES.auth}/api/auth/login`, {
    email: TEST_CONFIG.testUser.email,
    password: TEST_CONFIG.testUser.password
  });

  if (loginResponse.status === 200) {
    logSuccess('User login successful');
    authToken = loginResponse.data?.data?.token;
    refreshToken = loginResponse.data?.data?.refreshToken;
    testUserId = loginResponse.data?.data?.user?.id;
    
    if (!authToken) {
      logError('No auth token received');
      return false;
    }
  } else {
    logError(`User login failed: ${loginResponse.status} - ${JSON.stringify(loginResponse.data)}`);
    return false;
  }

  // Test token validation
  logInfo('Testing token validation...');
  const profileResponse = await makeRequest('GET', `${SERVICES.auth}/api/users/me`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (profileResponse.status === 200) {
    logSuccess('Token validation successful');
  } else {
    logError(`Token validation failed: ${profileResponse.status}`);
    return false;
  }

  // Test refresh token
  logInfo('Testing refresh token...');
  const refreshResponse = await makeRequest('POST', `${SERVICES.auth}/api/auth/refresh`, {
    refreshToken: refreshToken
  });

  if (refreshResponse.status === 200) {
    logSuccess('Token refresh successful');
    // Update token if new one is provided
    if (refreshResponse.data?.data?.token) {
      authToken = refreshResponse.data.data.token;
    }
  } else {
    logWarning(`Token refresh failed: ${refreshResponse.status} (may not be implemented)`);
  }

  return true;
}

// Document Service Tests
async function testDocumentService() {
  logSection('Testing Document Service');

  if (!authToken) {
    logError('No auth token available for document service tests');
    return false;
  }

  // Test service health
  const isHealthy = await testServiceHealth('Document', SERVICES.document);
  if (!isHealthy) return false;

  // Create test file
  const testFilePath = createTestFile();

  try {
    // Test document upload
    logInfo('Testing document upload...');
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testFilePath));
    formData.append('title', 'Test Document');
    formData.append('securityLevel', 'MEDIUM');

    const uploadResponse = await makeRequest('POST', `${SERVICES.document}/api/documents/upload`, formData, {
      'Authorization': `Bearer ${authToken}`,
      ...formData.getHeaders()
    });

    if (uploadResponse.status === 201) {
      logSuccess('Document upload successful');
      testDocumentId = uploadResponse.data?.data?.document?.id;
    } else {
      logError(`Document upload failed: ${uploadResponse.status} - ${JSON.stringify(uploadResponse.data)}`);
      return false;
    }

    // Test get documents list
    logInfo('Testing get documents list...');
    const listResponse = await makeRequest('GET', `${SERVICES.document}/api/documents?page=1&limit=10`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (listResponse.status === 200) {
      logSuccess('Get documents list successful');
    } else {
      logError(`Get documents list failed: ${listResponse.status}`);
    }

    // Test get specific document
    if (testDocumentId) {
      logInfo('Testing get specific document...');
      const getDocResponse = await makeRequest('GET', `${SERVICES.document}/api/documents/${testDocumentId}`, null, {
        'Authorization': `Bearer ${authToken}`
      });

      if (getDocResponse.status === 200) {
        logSuccess('Get specific document successful');
      } else {
        logError(`Get specific document failed: ${getDocResponse.status}`);
      }

      // Test document verification
      logInfo('Testing document verification...');
      const verifyResponse = await makeRequest('POST', `${SERVICES.document}/api/verification/${testDocumentId}/verify`, null, {
        'Authorization': `Bearer ${authToken}`
      });

      if (verifyResponse.status === 200) {
        logSuccess('Document verification successful');
      } else {
        logWarning(`Document verification failed: ${verifyResponse.status} (may require blockchain setup)`);
      }
    }

    return true;

  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

// Signature Service Tests
async function testSignatureService() {
  logSection('Testing Signature Service');

  if (!authToken || !testDocumentId) {
    logError('No auth token or document ID available for signature service tests');
    return false;
  }

  // Test service health
  const isHealthy = await testServiceHealth('Signature', SERVICES.signature);
  if (!isHealthy) return false;

  // Test document signing
  logInfo('Testing document signing...');
  const signResponse = await makeRequest('POST', `${SERVICES.signature}/api/signatures/${testDocumentId}/sign`, {
    signatureType: 'ELECTRONIC',
    signatureData: 'base64-encoded-signature-data',
    metadata: {
      location: 'Test Location',
      reason: 'Testing signature functionality'
    }
  }, {
    'Authorization': `Bearer ${authToken}`
  });

  if (signResponse.status === 201) {
    logSuccess('Document signing successful');
    testSignatureId = signResponse.data?.data?.signature?.id;
  } else {
    logError(`Document signing failed: ${signResponse.status} - ${JSON.stringify(signResponse.data)}`);
    return false;
  }

  // Test get signatures for document
  logInfo('Testing get signatures for document...');
  const getSignaturesResponse = await makeRequest('GET', `${SERVICES.signature}/api/signatures/document/${testDocumentId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (getSignaturesResponse.status === 200) {
    logSuccess('Get signatures for document successful');
  } else {
    logWarning(`Get signatures for document failed: ${getSignaturesResponse.status}`);
  }

  // Test signature verification
  if (testSignatureId) {
    logInfo('Testing signature verification...');
    const verifySignatureResponse = await makeRequest('POST', `${SERVICES.signature}/api/signatures/${testSignatureId}/verify`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (verifySignatureResponse.status === 200) {
      logSuccess('Signature verification successful');
    } else {
      logWarning(`Signature verification failed: ${verifySignatureResponse.status}`);
    }
  }

  return true;
}

// Email Service Tests
async function testEmailService() {
  logSection('Testing Email Service');

  // Test service health
  const isHealthy = await testServiceHealth('Email', SERVICES.email);
  if (!isHealthy) return false;

  // Test send general email (requires API key)
  logInfo('Testing send general email...');
  const emailResponse = await makeRequest('POST', `${SERVICES.email}/api/email/send`, {
    to: TEST_CONFIG.testUser.email,
    subject: 'VerSafe Test Email',
    template: 'general',
    data: {
      message: 'This is a test email from VerSafe service tests.',
      timestamp: new Date().toISOString()
    }
  }, {
    'X-API-Key': TEST_CONFIG.apiKey
  });

  if (emailResponse.status === 200) {
    logSuccess('Send general email successful');
  } else {
    logWarning(`Send general email failed: ${emailResponse.status} (may require valid API key and email configuration)`);
  }

  // Test welcome email
  logInfo('Testing welcome email...');
  const welcomeResponse = await makeRequest('POST', `${SERVICES.email}/api/email/welcome`, {
    userEmail: TEST_CONFIG.testUser.email,
    userName: TEST_CONFIG.testUser.name,
    verificationToken: 'test-verification-token'
  }, {
    'X-API-Key': TEST_CONFIG.apiKey
  });

  if (welcomeResponse.status === 200) {
    logSuccess('Welcome email successful');
  } else {
    logWarning(`Welcome email failed: ${welcomeResponse.status} (may require valid email configuration)`);
  }

  return true;
}

// Profile Service Tests
async function testProfileService() {
  logSection('Testing Profile Service');

  if (!authToken) {
    logError('No auth token available for profile service tests');
    return false;
  }

  // Test service health
  const isHealthy = await testServiceHealth('Profile', SERVICES.profile);
  if (!isHealthy) return false;

  // Test get user profile
  logInfo('Testing get user profile...');
  const getProfileResponse = await makeRequest('GET', `${SERVICES.profile}/api/profiles/me`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (getProfileResponse.status === 200) {
    logSuccess('Get user profile successful');
  } else {
    logWarning(`Get user profile failed: ${getProfileResponse.status} (profile may not exist yet)`);
  }

  // Test update user profile
  logInfo('Testing update user profile...');
  const updateProfileResponse = await makeRequest('PUT', `${SERVICES.profile}/api/profiles/me`, {
    firstName: 'Test',
    lastName: 'User',
    phone: '+1234567890',
    organization: 'VerSafe Testing Inc.',
    jobTitle: 'QA Tester'
  }, {
    'Authorization': `Bearer ${authToken}`
  });

  if (updateProfileResponse.status === 200 || updateProfileResponse.status === 201) {
    logSuccess('Update user profile successful');
  } else {
    logWarning(`Update user profile failed: ${updateProfileResponse.status}`);
  }

  return true;
}

// Blockchain Service Tests
async function testBlockchainService() {
  logSection('Testing Blockchain Service');

  // Test service health
  const isHealthy = await testServiceHealth('Blockchain', SERVICES.blockchain);
  if (!isHealthy) return false;

  // Test document registration on blockchain
  logInfo('Testing document registration on blockchain...');
  const registerResponse = await makeRequest('POST', `${SERVICES.blockchain}/api/blockchain/register`, {
    documentId: testDocumentId || 'TEST_DOC_123',
    hash: 'sha256-test-hash-value',
    algorithm: 'SHA-256',
    userId: testUserId || 'test-user-id',
    fileName: 'test-document.txt'
  }, {
    'X-API-Key': TEST_CONFIG.apiKey
  });

  if (registerResponse.status === 200 || registerResponse.status === 201) {
    logSuccess('Document registration on blockchain successful');
  } else {
    logWarning(`Document registration on blockchain failed: ${registerResponse.status} (may require Hyperledger Fabric setup)`);
  }

  // Test document verification on blockchain
  logInfo('Testing document verification on blockchain...');
  const verifyResponse = await makeRequest('POST', `${SERVICES.blockchain}/api/blockchain/verify`, {
    documentId: testDocumentId || 'TEST_DOC_123'
  }, {
    'X-API-Key': TEST_CONFIG.apiKey
  });

  if (verifyResponse.status === 200) {
    logSuccess('Document verification on blockchain successful');
  } else {
    logWarning(`Document verification on blockchain failed: ${verifyResponse.status} (may require Hyperledger Fabric setup)`);
  }

  return true;
}

// Nginx Gateway Tests
async function testNginxGateway() {
  logSection('Testing Nginx Gateway');

  // Test service health
  const isHealthy = await testServiceHealth('Nginx Gateway', SERVICES.nginx);
  if (!isHealthy) return false;

  // Test routing to auth service through gateway
  logInfo('Testing routing through Nginx gateway...');
  const gatewayResponse = await makeRequest('GET', `${SERVICES.nginx}/api/auth/health`);

  if (gatewayResponse.status === 200) {
    logSuccess('Nginx gateway routing successful');
  } else {
    logWarning(`Nginx gateway routing failed: ${gatewayResponse.status} (gateway may not be configured)`);
  }

  return true;
}

// Main test runner
async function runAllTests() {
  logSection('VerSafe Services Integration Test Suite');
  logInfo('Starting comprehensive service tests...');

  const results = {
    auth: false,
    document: false,
    signature: false,
    email: false,
    profile: false,
    blockchain: false,
    nginx: false
  };

  try {
    // Test Authentication Service (must be first)
    results.auth = await testAuthService();

    if (results.auth) {
      // Test other services that require authentication
      results.document = await testDocumentService();
      results.signature = await testSignatureService();
      results.profile = await testProfileService();
    } else {
      logWarning('Skipping authenticated service tests due to auth failure');
    }

    // Test services that don't require user authentication
    results.email = await testEmailService();
    results.blockchain = await testBlockchainService();
    results.nginx = await testNginxGateway();

  } catch (error) {
    logError(`Test suite failed with error: ${error.message}`);
    console.error(error.stack);
  }

  // Print final results
  logSection('Test Results Summary');
  let passedCount = 0;
  let totalCount = Object.keys(results).length;

  Object.entries(results).forEach(([service, passed]) => {
    if (passed) {
      logSuccess(`${service.toUpperCase()} Service: PASSED`);
      passedCount++;
    } else {
      logError(`${service.toUpperCase()} Service: FAILED`);
    }
  });

  logSection(`Overall Results: ${passedCount}/${totalCount} services passed`);

  if (passedCount === totalCount) {
    logSuccess('🎉 All services are working correctly!');
  } else if (passedCount > 0) {
    logWarning(`⚠️  ${totalCount - passedCount} service(s) need attention`);
  } else {
    logError('❌ All services failed - check your Docker containers and configuration');
  }

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuthService,
  testDocumentService,
  testSignatureService,
  testEmailService,
  testProfileService,
  testBlockchainService,
  testNginxGateway,
  SERVICES,
  TEST_CONFIG
};
