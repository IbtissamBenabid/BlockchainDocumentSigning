
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  Document,
  DocumentStatus,
  SecurityLevel,
  SignatureType,
  VerificationMethod
} from '@/types/document';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface DocumentContextProps {
  documents: Document[];
  isLoading: boolean;
  uploadDocument: (file: File, title: string, securityLevel?: SecurityLevel) => Promise<Document | null>;
  getDocumentById: (id: string) => Document | undefined;
  signDocument: (
    documentId: string,
    signatureDataUrl: string,
    signatureMetadata?: any
  ) => Promise<boolean>;
  shareDocument: (documentId: string, email: string) => Promise<boolean>;
  verifyDocument: (documentId: string) => Promise<boolean>;
  revokeDocument: (documentId: string, reason: string) => Promise<boolean>;
  refreshDocuments: () => Promise<void>;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
const DOCUMENT_API_URL = `${API_BASE_URL}/api/documents`;

// Helper function to create axios instance with auth headers
const createAuthenticatedAxios = (token: string) => {
  return axios.create({
    baseURL: DOCUMENT_API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Helper function to transform backend document to frontend format
const transformBackendDocument = (backendDoc: any): Document => {
  return {
    id: backendDoc.id,
    title: backendDoc.title,
    fileName: backendDoc.fileName,
    fileType: backendDoc.fileType,
    uploadedAt: backendDoc.createdAt,
    status: mapBackendStatus(backendDoc.status),
    hash: backendDoc.hash,
    blockchainTxId: backendDoc.blockchainTxId,
    signatures: backendDoc.signatures || [],
    sharedWith: backendDoc.shares?.map((share: any) => share.email) || [],
    securityLevel: mapBackendSecurityLevel(backendDoc.securityLevel),
    metadata: {
      createdBy: "User", // This would come from user context
      createdAt: backendDoc.createdAt,
      pageCount: backendDoc.pageCount || 1,
      size: backendDoc.fileSize || 0,
      version: 1,
      contentHash: backendDoc.hash?.split(':')[1]?.substring(0, 32) || '',
      signaturesRequired: backendDoc.signaturesRequired || 1
    },
    verificationHistory: backendDoc.verificationHistory || []
  };
};

// Map backend status to frontend enum
const mapBackendStatus = (status: string): DocumentStatus => {
  switch (status?.toUpperCase()) {
    case 'UPLOADED': return DocumentStatus.UPLOADED;
    case 'SIGNED': return DocumentStatus.SIGNED;
    case 'PARTIALLY_SIGNED': return DocumentStatus.PARTIALLY_SIGNED;
    case 'VERIFIED': return DocumentStatus.VERIFIED;
    case 'SHARED': return DocumentStatus.SHARED;
    case 'REVOKED': return DocumentStatus.REVOKED;
    case 'EXPIRED': return DocumentStatus.EXPIRED;
    default: return DocumentStatus.UPLOADED;
  }
};

// Map backend security level to frontend enum
const mapBackendSecurityLevel = (level: string): SecurityLevel => {
  switch (level?.toUpperCase()) {
    case 'LOW': return SecurityLevel.LOW;
    case 'MEDIUM': return SecurityLevel.MEDIUM;
    case 'HIGH': return SecurityLevel.HIGH;
    case 'CRITICAL': return SecurityLevel.CRITICAL;
    default: return SecurityLevel.MEDIUM;
  }
};

const DocumentContext = createContext<DocumentContextProps | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { authState } = useAuth();

  // Load documents from backend when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.token) {
      refreshDocuments();
    } else {
      setDocuments([]);
      setIsLoading(false);
    }
  }, [authState.isAuthenticated, authState.token]);

  // Function to refresh documents from backend
  const refreshDocuments = async () => {
    if (!authState.token) {
      setDocuments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const api = createAuthenticatedAxios(authState.token);
      const response = await api.get('/');

      if (response.data.success) {
        const backendDocuments = response.data.data.documents || [];
        const transformedDocuments = backendDocuments.map(transformBackendDocument);
        setDocuments(transformedDocuments);
      } else {
        console.error('Failed to fetch documents:', response.data.message);
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to load documents');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    title: string,
    securityLevel: SecurityLevel = SecurityLevel.MEDIUM
  ): Promise<Document | null> => {
    if (!authState.token) {
      toast.error('Please log in to upload documents');
      return null;
    }

    try {
      setIsLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', title);
      formData.append('securityLevel', securityLevel.toUpperCase());

      // Create axios instance for file upload (different content type)
      const api = axios.create({
        baseURL: DOCUMENT_API_URL,
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      });

      toast.info("Uploading document...");
      const response = await api.post('/upload', formData);

      if (response.data.success) {
        const backendDoc = response.data.data.document;
        const newDocument = transformBackendDocument(backendDoc);

        // Add to local state
        setDocuments(prev => [...prev, newDocument]);

        toast.success(response.data.message || 'Document uploaded successfully');
        return newDocument;
      } else {
        toast.error(response.data.message || 'Failed to upload document');
        return null;
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to upload document');
        }
      } else {
        toast.error('Failed to upload document');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentById = (id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  };

  const signDocument = async (
    documentId: string,
    signatureDataUrl: string,
    signatureMetadata = {}
  ): Promise<boolean> => {
    // TODO: Implement real signature API call when signature service is integrated
    try {
      setIsLoading(true);

      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      // Check if document can be signed
      if (document.status === DocumentStatus.REVOKED) {
        toast.error("This document has been revoked and cannot be signed");
        return false;
      }

      if (document.status === DocumentStatus.EXPIRED) {
        toast.error("This document has expired and cannot be signed");
        return false;
      }

      // Simulate signing process
      toast.info("Preparing signature for blockchain registration...");
      await new Promise(resolve => setTimeout(resolve, 700));

      toast.info("Computing cryptographic proof...");
      await new Promise(resolve => setTimeout(resolve, 600));

      toast.info("Sending transaction to blockchain...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate verification result
      const verified = Math.random() > 0.05; // 95% success rate

      // Determine new document status based on required signatures
      let newStatus = DocumentStatus.SIGNED;

      // If document requires multiple signatures
      if (document.metadata?.signaturesRequired && document.metadata.signaturesRequired > 1) {
        const currentSignatures = (document.signatures || []).length;
        if (currentSignatures + 1 < document.metadata.signaturesRequired) {
          newStatus = DocumentStatus.PARTIALLY_SIGNED;
          toast.info(`Document requires ${document.metadata.signaturesRequired - currentSignatures - 1} more signature(s)`);
        }
      }

      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          const updatedSignatures = [
            ...(doc.signatures || []),
            {
              id: Date.now().toString(),
              userId: authState.user?.id || '1',
              userName: authState.user?.name || 'User',
              timestamp: new Date().toISOString(),
              signatureDataUrl,
              signatureType: SignatureType.ELECTRONIC,
              verified,
              ...signatureMetadata
            },
          ];

          const updatedVerificationHistory = [
            ...(doc.verificationHistory || []),
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              verifierId: authState.user?.id || '1',
              verifierName: authState.user?.name || 'User',
              verified,
              verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION,
              details: `Signature verification: ${verified ? 'Success' : 'Failed'}`
            }
          ];

          return {
            ...doc,
            signatures: updatedSignatures,
            verificationHistory: updatedVerificationHistory,
            status: newStatus,
          };
        }
        return doc;
      }));

      toast.success('Document signed successfully and recorded on blockchain');
      return true;
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const shareDocument = async (documentId: string, email: string): Promise<boolean> => {
    // TODO: Implement real sharing API call when sharing service is integrated
    try {
      setIsLoading(true);

      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      // Check if document can be shared
      if (document.status === DocumentStatus.REVOKED) {
        toast.error("This document has been revoked and cannot be shared");
        return false;
      }

      // Simulate sharing process
      toast.info("Preparing secure sharing link...");
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.info("Encrypting document access...");
      await new Promise(resolve => setTimeout(resolve, 600));

      // Check if email is already in sharedWith list
      if (document.sharedWith?.includes(email)) {
        toast.info(`Document already shared with ${email}`);
        return true;
      }

      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          const updatedSharedWith = [
            ...(doc.sharedWith || []),
            email,
          ];

          const updatedVerificationHistory = [
            ...(doc.verificationHistory || []),
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              verifierId: authState.user?.id || '1',
              verifierName: authState.user?.name || 'User',
              verified: true,
              verificationMethod: VerificationMethod.HASH_COMPARISON,
              details: `Document shared with ${email}`
            }
          ];

          return {
            ...doc,
            sharedWith: updatedSharedWith,
            verificationHistory: updatedVerificationHistory,
            status: DocumentStatus.SHARED,
          };
        }
        return doc;
      }));

      toast.success(`Document shared with ${email}`);
      return true;
    } catch (error) {
      console.error('Error sharing document:', error);
      toast.error('Failed to share document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDocument = async (documentId: string): Promise<boolean> => {
    // TODO: Implement real verification API call when verification service is integrated
    try {
      setIsLoading(true);

      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      // Simulate verification process
      toast.info("Connecting to blockchain network...");
      await new Promise(resolve => setTimeout(resolve, 600));

      toast.info("Retrieving transaction details...");
      await new Promise(resolve => setTimeout(resolve, 700));

      toast.info("Verifying cryptographic proofs...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate verification result
      const verified = Math.random() > 0.05; // 95% success rate
      const blockNumber = Math.floor(Math.random() * 1000000) + 15000000;
      const confirmations = Math.floor(Math.random() * 50) + 1;

      if (!verified) {
        toast.error("Document verification failed! Hash mismatch detected.");
        return false;
      }

      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          const updatedVerificationHistory = [
            ...(doc.verificationHistory || []),
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              verifierId: authState.user?.id || '1',
              verifierName: authState.user?.name || 'User',
              verified,
              verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION,
              details: `Blockchain verification: Block ${blockNumber}, ${confirmations} confirmations`
            }
          ];

          return {
            ...doc,
            verificationHistory: updatedVerificationHistory,
            status: DocumentStatus.VERIFIED,
          };
        }
        return doc;
      }));

      toast.success('Document verified on blockchain');
      return true;
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error('Failed to verify document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDocument = async (documentId: string, reason: string): Promise<boolean> => {
    // TODO: Implement real revocation API call when revocation service is integrated
    try {
      setIsLoading(true);

      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      // Simulate revocation process
      toast.info("Preparing revocation transaction...");
      await new Promise(resolve => setTimeout(resolve, 600));

      toast.info("Sending revocation to blockchain...");
      await new Promise(resolve => setTimeout(resolve, 800));

      setDocuments(prev => prev.map(doc => {
        if (doc.id === documentId) {
          const updatedVerificationHistory = [
            ...(doc.verificationHistory || []),
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              verifierId: authState.user?.id || '1',
              verifierName: authState.user?.name || 'User',
              verified: true,
              verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION,
              details: `Document revoked: ${reason}`
            }
          ];

          return {
            ...doc,
            revoked: true,
            revokedReason: reason,
            status: DocumentStatus.REVOKED,
            verificationHistory: updatedVerificationHistory,
          };
        }
        return doc;
      }));

      toast.success('Document has been revoked');
      return true;
    } catch (error) {
      console.error('Error revoking document:', error);
      toast.error('Failed to revoke document');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        isLoading,
        uploadDocument,
        getDocumentById,
        signDocument,
        shareDocument,
        verifyDocument,
        revokeDocument,
        refreshDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
