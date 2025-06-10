# VerSafe Services Integration Test Suite

This comprehensive test suite validates all VerSafe microservices to ensure they are working correctly and can communicate with each other.

## 🧪 What This Test Suite Does

The test suite performs end-to-end testing of all VerSafe services:

### 1. **Authentication Service** (Port 3001)
- ✅ Service health check
- ✅ User registration
- ✅ User login
- ✅ Token validation
- ✅ Token refresh

### 2. **Document Service** (Port 3002)
- ✅ Service health check
- ✅ Document upload with file handling
- ✅ Document listing with pagination
- ✅ Document retrieval by ID
- ✅ Document verification

### 3. **Signature Service** (Port 3003)
- ✅ Service health check
- ✅ Document signing (electronic signatures)
- ✅ Signature retrieval for documents
- ✅ Signature verification

### 4. **Email Service** (Port 3004)
- ✅ Service health check
- ✅ General email sending
- ✅ Welcome email templates
- ✅ API key authentication

### 5. **Profile Service** (Port 3005)
- ✅ Service health check
- ✅ User profile retrieval
- ✅ User profile updates

### 6. **Blockchain Service** (Port 3006)
- ✅ Service health check
- ✅ Document registration on blockchain
- ✅ Document verification on blockchain
- ✅ Hyperledger Fabric integration

### 7. **Nginx Gateway** (Port 80)
- ✅ Service health check
- ✅ Request routing validation

## 🚀 Quick Start

### Prerequisites
1. All VerSafe services must be running (use `docker-compose up`)
2. Node.js installed on your system
3. Network access to service ports

### Installation
```bash
# Navigate to the backend directory
cd ver-safe/backend

# Install test dependencies
npm install axios form-data

# Or use the provided package file
cp test-package.json package.json
npm install
```

### Running Tests

#### Run All Tests
```bash
node test-all-services.js
```

#### Run Individual Service Tests
```bash
# Test only authentication service
node -e "require('./test-all-services').testAuthService()"

# Test only document service
node -e "require('./test-all-services').testDocumentService()"

# Test only signature service
node -e "require('./test-all-services').testSignatureService()"

# Test only email service
node -e "require('./test-all-services').testEmailService()"

# Test only profile service
node -e "require('./test-all-services').testProfileService()"

# Test only blockchain service
node -e "require('./test-all-services').testBlockchainService()"

# Test only nginx gateway
node -e "require('./test-all-services').testNginxGateway()"
```

## ⚙️ Configuration

### Test Configuration
Edit the `TEST_CONFIG` object in `test-all-services.js`:

```javascript
const TEST_CONFIG = {
  testUser: {
    email: 'test@versafe.com',        // Test user email
    password: 'TestPassword123!',      // Test user password
    name: 'Test User'                  // Test user name
  },
  apiKey: 'your-internal-api-key',     // API key for inter-service communication
  timeout: 10000                       // Request timeout in milliseconds
};
```

### Service URLs
The test suite automatically detects services running on localhost:

```javascript
const SERVICES = {
  auth: 'http://localhost:3001',
  document: 'http://localhost:3002',
  signature: 'http://localhost:3003',
  email: 'http://localhost:3004',
  profile: 'http://localhost:3005',
  blockchain: 'http://localhost:3006',
  nginx: 'http://localhost:80'
};
```

## 📊 Understanding Test Results

### Success Indicators
- ✅ **Green checkmarks**: Test passed successfully
- ℹ️ **Blue info**: Test step information
- ⚠️ **Yellow warnings**: Test passed but with warnings (expected for some configurations)

### Failure Indicators
- ❌ **Red X marks**: Test failed
- Error messages with HTTP status codes and response details

### Sample Output
```
=== VerSafe Services Integration Test Suite ===
ℹ️  Starting comprehensive service tests...

=== Testing Authentication Service ===
ℹ️  Testing Auth service health...
✅ Auth service is healthy (/)
ℹ️  Testing user registration...
⚠️  User already exists (expected for repeated tests)
ℹ️  Testing user login...
✅ User login successful
ℹ️  Testing token validation...
✅ Token validation successful

=== Test Results Summary ===
✅ AUTH Service: PASSED
✅ DOCUMENT Service: PASSED
✅ SIGNATURE Service: PASSED
⚠️  EMAIL Service: FAILED
✅ PROFILE Service: PASSED
⚠️  BLOCKCHAIN Service: FAILED
✅ NGINX Service: PASSED

=== Overall Results: 5/7 services passed ===
⚠️  2 service(s) need attention
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Services Not Responding
```
❌ Auth service is not responding
```
**Solution**: Ensure Docker containers are running:
```bash
cd ver-safe/backend
docker-compose up -d
docker-compose ps
```

#### 2. Authentication Failures
```
❌ User login failed: 401
```
**Solutions**:
- Check database is initialized
- Verify user credentials in TEST_CONFIG
- Ensure auth service environment variables are set

#### 3. Email Service Failures
```
⚠️  Send general email failed: 500 (may require valid email configuration)
```
**Solution**: Configure email service environment variables:
```bash
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
```

#### 4. Blockchain Service Failures
```
⚠️  Document registration on blockchain failed: 500 (may require Hyperledger Fabric setup)
```
**Solution**: This is expected if Hyperledger Fabric is not fully configured. The service health check should still pass.

#### 5. File Upload Issues
```
❌ Document upload failed: 400
```
**Solutions**:
- Ensure upload directory exists and is writable
- Check file size limits
- Verify multipart form data handling

### Debug Mode
For detailed debugging, modify the test file to log full responses:
```javascript
console.log('Full response:', JSON.stringify(response, null, 2));
```

## 🔄 Continuous Integration

This test suite can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run VerSafe Integration Tests
  run: |
    cd ver-safe/backend
    npm install axios form-data
    node test-all-services.js
```

## 📝 Extending Tests

To add new tests:

1. Create a new test function following the pattern:
```javascript
async function testNewService() {
  logSection('Testing New Service');
  // Test implementation
  return true; // or false
}
```

2. Add the test to the main runner:
```javascript
results.newService = await testNewService();
```

3. Export the function in the module.exports

## 🤝 Contributing

When adding new tests:
- Follow the existing logging patterns
- Include proper error handling
- Add both positive and negative test cases
- Update this README with new test descriptions

## 📄 License

This test suite is part of the VerSafe project and follows the same license terms.
