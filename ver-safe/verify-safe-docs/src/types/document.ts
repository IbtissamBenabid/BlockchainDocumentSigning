
export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: DocumentStatus;
  hash?: string;
  blockchainTxId?: string;
  signatures?: Signature[];
  sharedWith?: string[];
  verificationHistory?: VerificationRecord[];
  expiryDate?: string;
  securityLevel?: SecurityLevel;
  revoked?: boolean;
  revokedReason?: string;
  metadata?: DocumentMetadata;
  // New fields for AI-powered features
  aiClassification?: AIDocumentClassification;
  securityAnalysis?: SecurityAnalysis;
  // Fields for dynamic smart documents
  conditions?: DocumentCondition[];
  automations?: DocumentAutomation[];
}

export enum DocumentStatus {
  UPLOADED = "UPLOADED",
  PENDING_SIGNATURE = "PENDING_SIGNATURE",
  PARTIALLY_SIGNED = "PARTIALLY_SIGNED",
  SIGNED = "SIGNED",
  VERIFIED = "VERIFIED",
  SHARED = "SHARED",
  EXPIRED = "EXPIRED",
  REVOKED = "REVOKED",
  // New statuses for automated workflows
  PENDING_APPROVAL = "PENDING_APPROVAL",
  APPROVAL_REJECTED = "APPROVAL_REJECTED",
  PENDING_CONDITIONS = "PENDING_CONDITIONS",
  CONDITIONS_MET = "CONDITIONS_MET"
}

export enum SecurityLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export interface Signature {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  signatureDataUrl?: string;
  signatureType: SignatureType;
  ipAddress?: string;
  deviceInfo?: string;
  verified: boolean;
  verificationMethod?: VerificationMethod;
  // New fields for advanced biometric authentication
  biometricData?: BiometricVerification;
}

export enum SignatureType {
  ELECTRONIC = "ELECTRONIC",
  BIOMETRIC = "BIOMETRIC",
  DIGITAL_CERTIFICATE = "DIGITAL_CERTIFICATE",
  // New signature types
  ZERO_KNOWLEDGE = "ZERO_KNOWLEDGE",
  MULTI_FACTOR = "MULTI_FACTOR",
  DECENTRALIZED_IDENTITY = "DECENTRALIZED_IDENTITY"
}

export enum VerificationMethod {
  HASH_COMPARISON = "HASH_COMPARISON",
  BLOCKCHAIN_VERIFICATION = "BLOCKCHAIN_VERIFICATION",
  DIGITAL_CERTIFICATE = "DIGITAL_CERTIFICATE",
  MULTI_FACTOR = "MULTI_FACTOR",
  // New verification methods
  ZERO_KNOWLEDGE_PROOF = "ZERO_KNOWLEDGE_PROOF",
  DECENTRALIZED_IDENTITY = "DECENTRALIZED_IDENTITY",
  AI_ANOMALY_DETECTION = "AI_ANOMALY_DETECTION",
  BIOMETRIC_VERIFICATION = "BIOMETRIC_VERIFICATION"
}

export interface VerificationRecord {
  id: string;
  timestamp: string;
  verifierId?: string;
  verifierName?: string;
  verified: boolean;
  verificationMethod: VerificationMethod;
  details?: string;
  // New fields for compliance and regulatory tracking
  complianceFramework?: string;
  jurisdictionCode?: string;
  regulatoryStatus?: RegulatoryComplianceStatus;
}

export interface BlockchainVerification {
  verified: boolean;
  timestamp: string;
  transactionId: string;
  blockNumber: number;
  blockTimestamp?: string;
  networkId?: string;
  gasUsed?: number;
  confirmations?: number;
  // New fields for zero-knowledge proofs
  zkProofId?: string;
  proofVerified?: boolean;
}

export interface DocumentMetadata {
  createdBy: string;
  createdAt: string;
  modifiedAt?: string;
  pageCount?: number;
  size?: number;
  keywords?: string[];
  version?: number;
  contentHash?: string;
  signaturesRequired?: number;
  // New fields for AI-extracted metadata
  extractedEntities?: ExtractedEntity[];
  confidenceScore?: number;
  processingStatus?: AIProcessingStatus;
}

// New interfaces for AI-powered features
export interface AIDocumentClassification {
  documentType: string;
  confidenceScore: number;
  classificationTimestamp: string;
  modelVersion: string;
  suggestedTags?: string[];
}

export interface SecurityAnalysis {
  riskScore: number; // 0-100
  potentialIssues?: SecurityIssue[];
  lastAnalyzed: string;
  recommendations?: string[];
}

export interface SecurityIssue {
  type: SecurityIssueType;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectionMethod: string;
}

export enum SecurityIssueType {
  TAMPERING = "TAMPERING",
  FORGED_SIGNATURE = "FORGED_SIGNATURE",
  INCONSISTENT_METADATA = "INCONSISTENT_METADATA",
  UNUSUAL_ACCESS_PATTERN = "UNUSUAL_ACCESS_PATTERN",
  SUSPICIOUS_IP = "SUSPICIOUS_IP"
}

export interface ExtractedEntity {
  type: string; // e.g., "person", "organization", "date", "amount"
  value: string;
  position?: {page: number, coordinates: number[]};
  confidenceScore: number;
}

export enum AIProcessingStatus {
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REQUIRES_REVIEW = "REQUIRES_REVIEW"
}

// New interfaces for dynamic smart documents
export interface DocumentCondition {
  id: string;
  type: ConditionType;
  description: string;
  status: ConditionStatus;
  parameters: Record<string, any>;
  evaluationTimestamp?: string;
}

export enum ConditionType {
  TIME_BASED = "TIME_BASED",
  SIGNATURE_COUNT = "SIGNATURE_COUNT",
  EXTERNAL_EVENT = "EXTERNAL_EVENT",
  ORACLE_DATA = "ORACLE_DATA",
  API_RESPONSE = "API_RESPONSE"
}

export enum ConditionStatus {
  PENDING = "PENDING",
  MET = "MET",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED"
}

export interface DocumentAutomation {
  id: string;
  triggerConditionId: string;
  actionType: AutomationActionType;
  status: AutomationStatus;
  parameters: Record<string, any>;
  executionTimestamp?: string;
  result?: string;
}

export enum AutomationActionType {
  CHANGE_STATUS = "CHANGE_STATUS",
  NOTIFICATION = "NOTIFICATION",
  API_CALL = "API_CALL",
  TRANSFER_OWNERSHIP = "TRANSFER_OWNERSHIP",
  PAYMENT_RELEASE = "PAYMENT_RELEASE"
}

export enum AutomationStatus {
  PENDING = "PENDING",
  EXECUTED = "EXECUTED",
  FAILED = "FAILED",
  CANCELED = "CANCELED"
}

// New interfaces for biometric authentication
export interface BiometricVerification {
  type: BiometricType;
  verificationId: string;
  verificationTimestamp: string;
  confidenceScore: number;
  deviceUsed?: string;
  livenessVerified?: boolean;
}

export enum BiometricType {
  FINGERPRINT = "FINGERPRINT",
  FACIAL = "FACIAL",
  VOICE = "VOICE",
  BEHAVIORAL = "BEHAVIORAL",
  MULTI_MODAL = "MULTI_MODAL"
}

// New enums for regulatory compliance
export enum RegulatoryComplianceStatus {
  COMPLIANT = "COMPLIANT",
  NON_COMPLIANT = "NON_COMPLIANT",
  PENDING_REVIEW = "PENDING_REVIEW",
  EXEMPTED = "EXEMPTED",
  NOT_APPLICABLE = "NOT_APPLICABLE"
}

// Interfaces for decentralized identity
export interface DecentralizedIdentity {
  did: string;
  method: string;
  controllerDid?: string;
  verificationMethods?: string[];
  lastVerified?: string;
}

// Add a docType to distinguish our Document interface from the browser's Document interface
export type DocType = Document;
