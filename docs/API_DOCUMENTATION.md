# VerSafe API Documentation

## 🌐 Base URLs

- **Development**: `http://localhost`
- **Staging**: `https://staging-api.versafe.com`
- **Production**: `https://api.versafe.com`

## 🔐 Authentication

All API endpoints (except public ones) require authentication using JWT tokens.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting Access Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

## 📋 API Endpoints

### Authentication Service (`/api/auth`)

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": false
    }
  }
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### User Management (`/api/users`)

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Document Service (`/api/documents`)

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `document`: File (required)
- `title`: String (required)
- `securityLevel`: String (BASIC|MEDIUM|HIGH)

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "document": {
      "id": "uuid",
      "title": "Contract.pdf",
      "filename": "contract_20240101.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "fileHash": "sha256_hash",
      "securityLevel": "MEDIUM",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### List Documents
```http
GET /api/documents?page=1&limit=10&search=contract
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Integer (default: 1)
- `limit`: Integer (default: 10, max: 100)
- `search`: String (optional)
- `securityLevel`: String (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "Contract.pdf",
        "filename": "contract_20240101.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "securityLevel": "MEDIUM",
        "isSigned": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### Get Document
```http
GET /api/documents/{documentId}
Authorization: Bearer <token>
```

#### Update Document
```http
PUT /api/documents/{documentId}
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Contract Title",
  "securityLevel": "HIGH"
}
```

#### Delete Document
```http
DELETE /api/documents/{documentId}
Authorization: Bearer <token>
```

#### Verify Document
```http
POST /api/verification/{documentId}/verify
Authorization: Bearer <token>
```

### Signature Service (`/api/signatures`)

#### Sign Document
```http
POST /api/signatures/{documentId}/sign
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "signatureType": "ELECTRONIC",
  "signatureData": "base64_signature_data",
  "metadata": {
    "location": "New York, NY",
    "reason": "Contract approval"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document signed successfully",
  "data": {
    "signature": {
      "id": "uuid",
      "documentId": "uuid",
      "signatureType": "ELECTRONIC",
      "signatureHash": "sha256_hash",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Get Document Signatures
```http
GET /api/signatures/document/{documentId}
Authorization: Bearer <token>
```

#### Verify Signature
```http
POST /api/signatures/{signatureId}/verify
Authorization: Bearer <token>
```

### Profile Service (`/api/profiles`)

#### Get Profile
```http
GET /api/profiles/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "organization": "Acme Corp",
      "jobTitle": "Manager",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### Update Profile
```http
PUT /api/profiles/me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "organization": "Acme Corp",
  "jobTitle": "Senior Manager",
  "bio": "Experienced professional...",
  "location": "New York, NY",
  "website": "https://johndoe.com"
}
```

### Email Service (`/api/email`)

#### Send Email
```http
POST /api/email/send
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Document Shared",
  "template": "document-share",
  "data": {
    "documentTitle": "Contract.pdf",
    "senderName": "John Doe",
    "message": "Please review this document"
  }
}
```

#### Send Welcome Email
```http
POST /api/email/welcome
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "userEmail": "newuser@example.com",
  "userName": "Jane Doe",
  "verificationToken": "verification_token"
}
```

### Blockchain Service (`/api/blockchain`)

#### Register Document
```http
POST /api/blockchain/register
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "documentId": "uuid",
  "hash": "sha256_document_hash",
  "algorithm": "SHA-256",
  "userId": "uuid",
  "fileName": "contract.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document registered on blockchain",
  "data": {
    "transactionId": "blockchain_tx_id",
    "blockNumber": 12345,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Verify Document
```http
POST /api/blockchain/verify
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "documentId": "uuid"
}
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🚨 HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **413 Payload Too Large**: File too large
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **503 Service Unavailable**: Service temporarily unavailable

## 🔄 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user
- **Email Sending**: 50 emails per hour per API key

## 📝 Request/Response Examples

### Complete Document Upload Flow

1. **Login to get token:**
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

2. **Upload document:**
```bash
curl -X POST http://localhost/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@contract.pdf" \
  -F "title=Important Contract" \
  -F "securityLevel=HIGH"
```

3. **Sign document:**
```bash
curl -X POST http://localhost/api/signatures/DOCUMENT_ID/sign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signatureType": "ELECTRONIC",
    "signatureData": "base64_signature",
    "metadata": {"location": "Office", "reason": "Approval"}
  }'
```

## 🔧 SDK Examples

### JavaScript/Node.js
```javascript
const VerSafeAPI = require('versafe-sdk');

const client = new VerSafeAPI({
  baseURL: 'http://localhost',
  apiKey: 'your-api-key'
});

// Login
const { token } = await client.auth.login('user@example.com', 'password');

// Upload document
const document = await client.documents.upload({
  file: fs.createReadStream('contract.pdf'),
  title: 'Contract',
  securityLevel: 'HIGH'
});

// Sign document
const signature = await client.signatures.sign(document.id, {
  type: 'ELECTRONIC',
  data: signatureData
});
```

### Python
```python
from versafe import VerSafeClient

client = VerSafeClient(
    base_url='http://localhost',
    api_key='your-api-key'
)

# Login
token = client.auth.login('user@example.com', 'password')

# Upload document
with open('contract.pdf', 'rb') as f:
    document = client.documents.upload(
        file=f,
        title='Contract',
        security_level='HIGH'
    )

# Sign document
signature = client.signatures.sign(
    document['id'],
    signature_type='ELECTRONIC',
    signature_data=signature_data
)
```
