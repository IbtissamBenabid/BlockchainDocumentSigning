# VerSafe Deployment Guide

## 🚀 Deployment Options

### 1. Docker Compose (Recommended for Development/Small Production)

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ disk space

#### Quick Deployment
```bash
# Clone repository
git clone <repository-url>
cd ver-safe/backend

# Start all services
docker-compose up -d

# Verify deployment
docker-compose ps
curl http://localhost/health
```

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Database with persistent storage
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: versafe_db
      POSTGRES_USER: versafe_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Redis with persistence
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Application services with health checks
  auth-service:
    build: ./auth-service
    environment:
      NODE_ENV: production
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  document_uploads:
  profile_uploads:

networks:
  versafe-network:
    driver: overlay
```

### 2. Kubernetes Deployment

#### Prerequisites
- Kubernetes 1.20+
- kubectl configured
- Helm 3.0+ (optional)

#### Namespace Setup
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: versafe
  labels:
    name: versafe
```

#### ConfigMap for Environment Variables
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: versafe-config
  namespace: versafe
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "versafe_db"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
```

#### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: versafe-secrets
  namespace: versafe
type: Opaque
data:
  db-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  redis-password: <base64-encoded-redis-password>
  api-key: <base64-encoded-api-key>
```

#### Database Deployment
```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: versafe
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          valueFrom:
            configMapKeyRef:
              name: versafe-config
              key: DB_NAME
        - name: POSTGRES_USER
          value: "versafe_user"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: versafe-secrets
              key: db-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: versafe
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

#### Application Service Deployment
```yaml
# k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: versafe
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: versafe/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: versafe-config
              key: NODE_ENV
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: versafe-config
              key: DB_HOST
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: versafe-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: versafe-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: versafe
spec:
  selector:
    app: auth-service
  ports:
  - port: 3001
    targetPort: 3001
```

#### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: versafe-ingress
  namespace: versafe
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.versafe.com
    secretName: versafe-tls
  rules:
  - host: api.versafe.com
    http:
      paths:
      - path: /api/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
      - path: /api/documents
        pathType: Prefix
        backend:
          service:
            name: document-service
            port:
              number: 3002
```

#### Deployment Commands
```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n versafe
kubectl get services -n versafe

# Scale services
kubectl scale deployment auth-service --replicas=3 -n versafe

# Update service
kubectl set image deployment/auth-service auth-service=versafe/auth-service:v2.0 -n versafe

# Check logs
kubectl logs -f deployment/auth-service -n versafe
```

### 3. AWS ECS Deployment

#### Task Definition
```json
{
  "family": "versafe-auth-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "auth-service",
      "image": "versafe/auth-service:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:versafe/db-password"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:versafe/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/versafe-auth-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:3001/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

#### ECS Service Configuration
```json
{
  "serviceName": "versafe-auth-service",
  "cluster": "versafe-cluster",
  "taskDefinition": "versafe-auth-service:1",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345", "subnet-67890"],
      "securityGroups": ["sg-versafe"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/versafe-auth",
      "containerName": "auth-service",
      "containerPort": 3001
    }
  ],
  "serviceRegistries": [
    {
      "registryArn": "arn:aws:servicediscovery:region:account:service/srv-auth"
    }
  ]
}
```

### 4. Google Cloud Run Deployment

#### Service Configuration
```yaml
# cloudrun-auth-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: versafe-auth-service
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      containers:
      - image: gcr.io/project-id/versafe-auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: versafe-secrets
              key: db-host
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
```

#### Deployment Commands
```bash
# Build and push image
docker build -t gcr.io/project-id/versafe-auth-service:latest ./auth-service
docker push gcr.io/project-id/versafe-auth-service:latest

# Deploy to Cloud Run
gcloud run deploy versafe-auth-service \
  --image gcr.io/project-id/versafe-auth-service:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

## 🔧 Environment Configuration

### Production Environment Variables
```env
# Application
NODE_ENV=production
LOG_LEVEL=info
PORT=3001

# Database
DB_HOST=postgres.internal
DB_PORT=5432
DB_NAME=versafe_db
DB_USER=versafe_user
DB_PASSWORD=secure_random_password
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis
REDIS_HOST=redis.internal
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
REDIS_DB=0
REDIS_TTL=3600

# JWT
JWT_SECRET=very_long_random_secret_key_change_in_production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=/app/uploads
ALLOWED_FILE_TYPES=pdf,doc,docx,jpg,png,gif

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@versafe.com
SMTP_PASSWORD=app_specific_password

# Blockchain
FABRIC_NETWORK_NAME=versafe-network
FABRIC_CHANNEL_NAME=versafe-channel
FABRIC_CHAINCODE_NAME=versafe-chaincode
FABRIC_MSP_ID=Org1MSP
FABRIC_PEER_ENDPOINT=peer0.org1.versafe.com:7051

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000

# CORS
CORS_ORIGIN=https://app.versafe.com,https://admin.versafe.com
CORS_CREDENTIALS=true
```

## 🔒 Security Configuration

### SSL/TLS Setup
```nginx
# nginx.conf for production
server {
    listen 443 ssl http2;
    server_name api.versafe.com;
    
    ssl_certificate /etc/ssl/certs/versafe.crt;
    ssl_certificate_key /etc/ssl/private/versafe.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Firewall Rules
```bash
# UFW rules for Ubuntu
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 3001:3006/tcp  # Block direct service access
ufw enable
```

## 📊 Monitoring Setup

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'versafe-services'
    static_configs:
      - targets: ['auth-service:9090', 'document-service:9090']
    metrics_path: /metrics
    scrape_interval: 30s
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "VerSafe Services",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      }
    ]
  }
}
```

## 🚨 Backup Strategy

### Database Backup
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="versafe_db"

# Create backup
pg_dump -h postgres -U versafe_user -d $DB_NAME > $BACKUP_DIR/versafe_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/versafe_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/versafe_$DATE.sql.gz s3://versafe-backups/postgres/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### File Backup
```bash
#!/bin/bash
# backup-files.sh
DATE=$(date +%Y%m%d_%H%M%S)
UPLOAD_DIR="/app/uploads"
BACKUP_DIR="/backups/files"

# Create tar archive
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz $UPLOAD_DIR

# Upload to S3
aws s3 cp $BACKUP_DIR/uploads_$DATE.tar.gz s3://versafe-backups/files/

# Clean old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t versafe/auth-service:${{ github.sha }} ./auth-service
          docker build -t versafe/document-service:${{ github.sha }} ./document-service
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push versafe/auth-service:${{ github.sha }}
          docker push versafe/document-service:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/auth-service auth-service=versafe/auth-service:${{ github.sha }}
          kubectl rollout status deployment/auth-service
```

This comprehensive deployment guide covers all major deployment scenarios and production considerations for the VerSafe platform.
