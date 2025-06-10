-- VerSafe Database Initialization Script
-- This script creates all necessary tables for the microservices

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for authentication service)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- User profiles table (for profile service)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_picture_url VARCHAR(500),
    phone VARCHAR(50),
    address TEXT,
    date_of_birth DATE,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (for document service)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'UPLOADED',
    security_level VARCHAR(20) DEFAULT 'MEDIUM',
    hash VARCHAR(255) NOT NULL,
    hash_algorithm VARCHAR(50) DEFAULT 'SHA-256',
    blockchain_tx_id VARCHAR(255),
    blockchain_network VARCHAR(50),
    page_count INTEGER,
    content_hash VARCHAR(255),
    signatures_required INTEGER DEFAULT 1,
    expiry_date TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_reason TEXT,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document metadata table
CREATE TABLE document_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document sharing table
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_email VARCHAR(255) NOT NULL,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    access_level VARCHAR(20) DEFAULT 'READ',
    expires_at TIMESTAMP,
    access_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signatures table (for signature service)
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    signature_type VARCHAR(50) NOT NULL,
    signature_data_url TEXT,
    signature_metadata JSONB DEFAULT '{}',
    ip_address INET,
    device_info TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(50),
    blockchain_tx_id VARCHAR(255),
    biometric_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verification history table
CREATE TABLE verification_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verifier_name VARCHAR(255),
    is_verified BOOLEAN NOT NULL,
    verification_method VARCHAR(50) NOT NULL,
    details TEXT,
    compliance_framework VARCHAR(100),
    jurisdiction_code VARCHAR(10),
    regulatory_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blockchain transactions table (for blockchain service)
CREATE TABLE blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    network VARCHAR(50) NOT NULL,
    block_number BIGINT,
    block_timestamp TIMESTAMP,
    gas_used BIGINT,
    gas_price BIGINT,
    confirmations INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_type VARCHAR(50) NOT NULL,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs table (for email service)
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    message_id VARCHAR(255),
    error_message TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys table (for service authentication)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Audit logs table (for security and compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_reset_token ON users(reset_password_token);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_hash ON documents(hash);
CREATE INDEX idx_documents_blockchain_tx_id ON documents(blockchain_tx_id);

CREATE INDEX idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX idx_document_shares_email ON document_shares(shared_with_email);
CREATE INDEX idx_document_shares_token ON document_shares(access_token);

CREATE INDEX idx_signatures_document_id ON signatures(document_id);
CREATE INDEX idx_signatures_user_id ON signatures(user_id);

CREATE INDEX idx_verification_history_document_id ON verification_history(document_id);

CREATE INDEX idx_blockchain_tx_hash ON blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_entity ON blockchain_transactions(related_entity_id, related_entity_type);

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX idx_email_logs_document_id ON email_logs(document_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- AI Analysis Results table
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- 'MALWARE_SCAN', 'CONTENT_ANALYSIS', 'RISK_ASSESSMENT'
    result VARCHAR(20) NOT NULL, -- 'BENIGN', 'MALICIOUS', 'SUSPICIOUS'
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    features_extracted TEXT, -- JSON string of extracted features
    model_version VARCHAR(20),
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Models Metadata table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'MALWARE_DETECTION', 'CONTENT_ANALYSIS', 'RISK_ASSESSMENT'
    version VARCHAR(20) NOT NULL,
    accuracy_score DECIMAL(5,4),
    training_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    model_path VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Service Logs table
CREATE TABLE ai_service_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_endpoint VARCHAR(100),
    request_id VARCHAR(100),
    document_id UUID,
    processing_time_ms INTEGER,
    status VARCHAR(20), -- 'SUCCESS', 'ERROR', 'TIMEOUT'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for AI tables
CREATE INDEX idx_ai_analysis_document_id ON ai_analysis(document_id);
CREATE INDEX idx_ai_analysis_timestamp ON ai_analysis(analysis_timestamp);
CREATE INDEX idx_ai_analysis_result ON ai_analysis(result);
CREATE INDEX idx_ai_models_type ON ai_models(model_type);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_ai_service_logs_document_id ON ai_service_logs(document_id);
CREATE INDEX idx_ai_service_logs_timestamp ON ai_service_logs(created_at);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, is_verified, is_active) VALUES
('admin@versafe.com', '$2b$10$rQZ8kHWKQYXHjQJ5X5X5X.X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5', 'System Administrator', TRUE, TRUE);

-- Insert sample API key for inter-service communication
INSERT INTO api_keys (service_name, key_hash, permissions) VALUES
('internal-services', '$2b$10$samplehashforinterservicecommunication', '{"all": true}'),
('ai-service', '$2b$10$aisamplehashforinterservicecommunication', '{"ai": true, "documents": true}');

-- Insert AI model metadata
INSERT INTO ai_models (model_name, model_type, version, accuracy_score, training_date, is_active, model_path, description) VALUES
('PDF Malware Detector', 'MALWARE_DETECTION', '1.0', 0.9250, CURRENT_TIMESTAMP, TRUE, '/app/pdf_malware_model.pkl', 'Logistic Regression model trained on PDFMalware2022 dataset for detecting malicious PDF files');

COMMIT;
