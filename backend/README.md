# VerSafe Backend - Microservices Architecture

A comprehensive microservices backend for secure document management with blockchain integration, digital signatures, and advanced security features.

## 🏗️ Architecture Overview

The VerSafe backend consists of 7 microservices:

1. **Authentication Service** (Port 3001) - User authentication and JWT management
2. **Document Management Service** (Port 3002) - Document upload, storage, and metadata
3. **Signature Service** (Port 3003) - Digital signatures and verification
4. **Email Service** (Port 3004) - Email notifications and document sharing
5. **User Profile Service** (Port 3005) - User profile management
6. **Blockchain Service** (Port 3006) - Hyperledger Fabric blockchain integration
7. **AI Service** (Port 8500) - PDF malware detection and document analysis

## 🔗 Hyperledger Fabric Integration

The system uses **Hyperledger Fabric** as the blockchain platform, providing:

- **Enterprise-grade blockchain**: Permissioned network suitable for business use
- **Free and open-source**: No transaction fees or gas costs
- **High performance**: Faster transaction processing than public blockchains
- **Privacy and confidentiality**: Private channels and data isolation
- **Smart contracts (Chaincode)**: Custom business logic for document management
- **Immutable audit trail**: Complete document lifecycle tracking

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- PostgreSQL 15+ (if running locally)
- Redis (for caching and sessions)

### Using Docker (Recommended)

1. **Clone and navigate to the backend directory:**
   ```bash
   cd ver-safe/backend
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check service health:**
   ```bash
   # Check all services are running
   docker-compose ps
   
   # Test individual services
   curl http://localhost:3001/health  # Auth Service
   curl http://localhost:3002/health  # Document Service
   curl http://localhost:3003/health  # Signature Service
   curl http://localhost:3004/health  # Email Service
   curl http://localhost:3005/health  # Profile Service
   curl http://localhost:3006/health  # Blockchain Service
   curl http://localhost:8500/health  # AI Service
   ```

### Development Setup

1. **Install dependencies for each service:**
   ```bash
   # Install dependencies for all services
   for service in auth-service document-service signature-service email-service profile-service blockchain-service; do
     cd $service && npm install && cd ..
   done
   ```

2. **Start PostgreSQL and Redis:**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Run services individually:**
   ```bash
   # Terminal 1 - Auth Service
   cd auth-service && npm run dev

   # Terminal 2 - Document Service
   cd document-service && npm run dev

   # Terminal 3 - Signature Service
   cd signature-service && npm run dev

   # Terminal 4 - Email Service
   cd email-service && npm run dev

   # Terminal 5 - Profile Service
   cd profile-service && npm run dev

   # Terminal 6 - Blockchain Service
   cd blockchain-service && npm run dev
   ```

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `user_profiles` - Extended user profile information
- `documents` - Document metadata and storage info
- `document_metadata` - Key-value document metadata
- `document_shares` - Document sharing permissions
- `signatures` - Digital signatures and verification
- `verification_history` - Document verification audit trail
- `blockchain_transactions` - Blockchain transaction records
- `email_logs` - Email sending history
- `audit_logs` - System audit trail
- `ai_analysis` - AI analysis results and malware scan data
- `ai_models` - AI model metadata and versioning
- `ai_service_logs` - AI service operation logs

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control
- API key authentication for inter-service communication
- Rate limiting and request throttling

### Document Security
- Multiple cryptographic hashing algorithms (SHA-256, SHA-3, BLAKE2)
- Blockchain integration for immutable records
- File type validation and virus scanning
- Secure file storage with access controls

### Data Protection
- Encryption at rest and in transit
- Audit logging for all operations
- GDPR compliance features
- Secure password hashing with bcrypt

## 📡 API Documentation

### Authentication Service (Port 3001)

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Document Service (Port 3002)

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

document: <file>
title: "My Document"
securityLevel: "MEDIUM"
```

#### Get Documents
```http
GET /api/documents?page=1&limit=10&status=UPLOADED
Authorization: Bearer <token>
```

#### Get Document by ID
```http
GET /api/documents/{documentId}
Authorization: Bearer <token>
```

#### Verify Document
```http
POST /api/verification/{documentId}/verify
Authorization: Bearer <token>
```

### Signature Service (Port 3003)

#### Sign Document
```http
POST /api/signatures/{documentId}/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "signatureType": "ELECTRONIC",
  "signatureData": "base64-signature-data",
  "metadata": {
    "location": "New York, NY",
    "reason": "Document approval"
  }
}
```

### Blockchain Service (Port 3006) - Hyperledger Fabric

#### Register Document on Blockchain
```http
POST /api/blockchain/register
X-API-Key: your-internal-api-key
Content-Type: application/json

{
  "documentId": "DOC_123456789",
  "hash": "sha256-hash-of-document",
  "algorithm": "SHA-256",
  "userId": "user-uuid",
  "fileName": "contract.pdf"
}
```

#### Verify Document on Blockchain
```http
POST /api/blockchain/verify
X-API-Key: your-internal-api-key
Content-Type: application/json

{
  "documentId": "DOC_123456789"
}
```

#### Update Document State
```http
PUT /api/blockchain/state
X-API-Key: your-internal-api-key
Content-Type: application/json

{
  "documentId": "DOC_123456789",
  "newState": "SIGNED",
  "metadata": {
    "signedBy": "user-uuid",
    "signatureType": "DIGITAL"
  }
}
```

#### Get Document History
```http
GET /api/blockchain/history/{documentId}
X-API-Key: your-internal-api-key
```

#### Get Fabric Network Information
```http
GET /api/fabric/network
X-API-Key: your-internal-api-key
```

### AI Service (Port 8500) - PDF Malware Detection

#### Scan PDF for Malware
```http
POST /api/ai/scan-pdf
X-API-Key: your-internal-api-key
Content-Type: multipart/form-data

file: <pdf-file>
document_id: "optional-document-uuid"
```

**Response:**
```json
{
  "success": true,
  "result": "Benign",
  "confidence": 0.9234,
  "risk_score": 8,
  "features_analyzed": 28,
  "analysis_timestamp": "2024-01-01T00:00:00Z",
  "model_version": "1.0"
}
```

#### Analyze Existing Document
```http
POST /api/ai/analyze-document/{documentId}
X-API-Key: your-internal-api-key
```

#### Get Analysis History
```http
GET /api/ai/analysis-history/{documentId}
X-API-Key: your-internal-api-key
```

**Features Analyzed:**
- PDF file size and structure
- Metadata analysis
- Encryption detection
- JavaScript presence
- Embedded files detection
- Suspicious object patterns
- 28+ security-related features

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=versafe_db
DB_USER=versafe_user
DB_PASSWORD=versafe_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_URL=redis://redis:6379

# Hyperledger Fabric Blockchain Configuration
FABRIC_CHANNEL_NAME=documentchannel
FABRIC_CHAINCODE_NAME=versafe-documents
FABRIC_MSP_ID=Org1MSP
FABRIC_USER_ID=appUser
FABRIC_CA_URL=https://localhost:7054
FABRIC_CA_NAME=ca-org1
FABRIC_WALLET_PATH=/app/fabric-wallet
FABRIC_CONNECTION_PROFILE=/app/fabric-network/connection-profile.json

# Email Configuration (Gmail)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REFRESH_TOKEN=your-gmail-refresh-token
EMAIL_FROM=noreply@versafe.com

# File Upload Configuration
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,png

# Security Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
INTERNAL_API_KEY=your-internal-api-key

# Service URLs (for inter-service communication)
AUTH_SERVICE_URL=http://auth-service:3001
DOCUMENT_SERVICE_URL=http://document-service:3002
SIGNATURE_SERVICE_URL=http://signature-service:3003
EMAIL_SERVICE_URL=http://email-service:3004
PROFILE_SERVICE_URL=http://profile-service:3005
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3006
AI_SERVICE_URL=http://ai-service:8500
```

## 🧪 Testing

### Run Tests
```bash
# Run tests for all services
npm run test

# Run tests for specific service
cd auth-service && npm test
cd document-service && npm test
```

### API Testing with curl

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Upload a document
curl -X POST http://localhost:3002/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "document=@/path/to/your/file.pdf" \
  -F "title=Test Document"
```

## 📈 Monitoring and Logging

### Health Checks
Each service provides a health check endpoint:
- `GET /health` - Returns service status and uptime

### Logging
- Structured logging with Morgan
- Audit trails for all operations
- Error tracking and reporting

### Metrics
- Request/response times
- Error rates
- Database query performance
- File upload statistics

## 🔄 Deployment

### Production Deployment

1. **Update environment variables for production**
2. **Build and push Docker images:**
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml push
   ```

3. **Deploy to your container orchestration platform:**
   - Kubernetes
   - Docker Swarm
   - AWS ECS
   - Google Cloud Run

### Scaling Considerations

- Use load balancers for high availability
- Implement database read replicas
- Use Redis clustering for session storage
- Consider CDN for file serving
- Implement horizontal pod autoscaling

## 🛠️ Development Guidelines

### Code Style
- Use ESLint and Prettier for code formatting
- Follow RESTful API conventions
- Implement proper error handling
- Write comprehensive tests

### Database Migrations
- Use database migration scripts for schema changes
- Always backup before migrations
- Test migrations in staging environment

### Security Best Practices
- Regular security audits
- Dependency vulnerability scanning
- Implement rate limiting
- Use HTTPS in production
- Regular backup and disaster recovery testing

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
