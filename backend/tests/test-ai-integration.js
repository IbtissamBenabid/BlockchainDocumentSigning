#!/usr/bin/env node

/**
 * AI Service Integration Test Script
 * Tests the integration between AI service and other microservices
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost';
const INTERNAL_API_KEY = 'versafe-internal-api-key-2024';

// Test endpoints
const endpoints = {
  auth: `${BASE_URL}:3001`,
  document: `${BASE_URL}:3002`,
  ai: `${BASE_URL}:8500`,
  nginx: `${BASE_URL}`
};

// Test user credentials
const testUser = {
  email: 'ai-test@versafe.com',
  password: 'testpassword123',
  name: 'AI Test User'
};

let authToken = '';
let testDocumentId = '';

/**
 * Test AI service health check
 */
async function testAIHealthCheck() {
  console.log('\n🔍 Testing AI Service Health Check...');
  try {
    const response = await axios.get(`${endpoints.ai}/health`);
    console.log('✅ AI Service Health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ AI Service Health Check Failed:', error.message);
    return false;
  }
}

/**
 * Test user authentication
 */
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  try {
    // Register test user
    try {
      await axios.post(`${endpoints.auth}/api/auth/register`, testUser);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, proceeding with login');
      } else {
        throw error;
      }
    }

    // Login
    const loginResponse = await axios.post(`${endpoints.auth}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    authToken = loginResponse.data.data.token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

/**
 * Test direct AI service PDF scanning
 */
async function testDirectAIScanning() {
  console.log('\n🤖 Testing Direct AI PDF Scanning...');
  try {
    // Create a simple test PDF content (this is a minimal PDF structure)
    const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    // Write test PDF to temporary file
    const testPDFPath = path.join(__dirname, 'test-document.pdf');
    fs.writeFileSync(testPDFPath, testPDFContent);

    // Create form data
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testPDFPath));

    // Test AI scanning
    const response = await axios.post(`${endpoints.ai}/api/ai/scan-pdf`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': INTERNAL_API_KEY
      }
    });

    console.log('✅ AI Scan Result:', response.data);

    // Clean up test file
    fs.unlinkSync(testPDFPath);
    return true;
  } catch (error) {
    console.error('❌ Direct AI scanning failed:', error.message);
    return false;
  }
}

/**
 * Test document upload with AI integration
 */
async function testDocumentUploadWithAI() {
  console.log('\n📄 Testing Document Upload with AI Integration...');
  try {
    // Create test PDF
    const testPDFContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(AI Test PDF)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 297 %%EOF`;

    const testPDFPath = path.join(__dirname, 'ai-test-document.pdf');
    fs.writeFileSync(testPDFPath, testPDFContent);

    // Upload document through document service
    const formData = new FormData();
    formData.append('document', fs.createReadStream(testPDFPath));
    formData.append('title', 'AI Integration Test Document');

    const response = await axios.post(`${endpoints.document}/api/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Document Upload with AI:', response.data);
    testDocumentId = response.data.data.document.id;

    // Clean up test file
    fs.unlinkSync(testPDFPath);
    return true;
  } catch (error) {
    console.error('❌ Document upload with AI failed:', error.message);
    return false;
  }
}

/**
 * Test AI analysis endpoints
 */
async function testAIAnalysisEndpoints() {
  console.log('\n📊 Testing AI Analysis Endpoints...');
  try {
    if (!testDocumentId) {
      console.log('⚠️ No test document ID available, skipping AI analysis tests');
      return false;
    }

    // Test get AI analysis
    const analysisResponse = await axios.get(
      `${endpoints.document}/api/documents/${testDocumentId}/ai-analysis`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ AI Analysis Retrieved:', analysisResponse.data);

    // Test trigger new AI analysis
    const newAnalysisResponse = await axios.post(
      `${endpoints.document}/api/documents/${testDocumentId}/ai-analysis`,
      {},
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );

    console.log('✅ New AI Analysis Triggered:', newAnalysisResponse.data);
    return true;
  } catch (error) {
    console.error('❌ AI analysis endpoints failed:', error.message);
    return false;
  }
}

/**
 * Test nginx routing to AI service
 */
async function testNginxAIRouting() {
  console.log('\n🌐 Testing Nginx AI Service Routing...');
  try {
    const response = await axios.get(`${endpoints.nginx}/api/ai/health`);
    console.log('✅ Nginx AI Routing:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Nginx AI routing failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting AI Service Integration Tests...');
  console.log('=' .repeat(50));

  const tests = [
    { name: 'AI Health Check', fn: testAIHealthCheck },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Direct AI Scanning', fn: testDirectAIScanning },
    { name: 'Document Upload with AI', fn: testDocumentUploadWithAI },
    { name: 'AI Analysis Endpoints', fn: testAIAnalysisEndpoints },
    { name: 'Nginx AI Routing', fn: testNginxAIRouting }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All AI integration tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };
