
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  Document,
  DocumentStatus,
  SecurityLevel
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
    if (!authState.token) {
      toast.error('Please log in to sign documents');
      return false;
    }

    try {
      setIsLoading(true);

      // Get document from local state first for validation
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

      toast.info("Preparing signature for blockchain registration...");

      // Create axios instance for signature service
      const SIGNATURE_API_URL = `${API_BASE_URL}/api/signatures`;
      const api = createAuthenticatedAxios(authState.token);
      api.defaults.baseURL = SIGNATURE_API_URL;

      // Prepare signature data
      const signatureData = {
        signatureType: 'ELECTRONIC',
        signatureData: signatureDataUrl,
        metadata: {
          ...signatureMetadata,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ipAddress: '127.0.0.1' // In production, this would be handled by the backend
        }
      };

      toast.info("Sending signature to blockchain...");

      // Call signature service API
      const response = await api.post(`/${documentId}/sign`, signatureData);

      if (response.data.success) {
        toast.success('Document signed successfully and recorded on blockchain');

        // Refresh documents to get updated state from backend
        await refreshDocuments();

        return true;
      } else {
        toast.error(response.data.message || 'Failed to sign document');
        return false;
      }
    } catch (error) {
      console.error('Error signing document:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response?.status === 404) {
          toast.error('Document not found or access denied');
        } else if (error.response?.status === 409) {
          // Document already signed
          const errorData = error.response.data;
          if (errorData?.data?.suggestion) {
            toast.warning(`${errorData.message}. ${errorData.data.suggestion}`);
          } else {
            toast.warning(errorData?.message || 'Document already signed by this user');
          }
          // Refresh documents to show current status
          await refreshDocuments();
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to sign document');
        }
      } else {
        toast.error('Failed to sign document');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const shareDocument = async (documentId: string, email: string): Promise<boolean> => {
    if (!authState.token) {
      toast.error('Please log in to share documents');
      return false;
    }

    try {
      setIsLoading(true);

      // Get document from local state first for validation
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

      toast.info("Preparing secure sharing link...");

      // Create axios instance for document service
      const api = createAuthenticatedAxios(authState.token);

      // Prepare sharing data
      const shareData = {
        email,
        accessLevel: 'read',
        message: `${authState.user?.name || 'A user'} has shared a document with you`
      };

      toast.info("Sending sharing invitation...");

      // Call document service API for sharing
      const response = await api.post(`/${documentId}/share`, shareData);

      if (response.data.success) {
        toast.success(`Document shared with ${email}`);

        // Refresh documents to get updated state from backend
        await refreshDocuments();

        return true;
      } else {
        toast.error(response.data.message || 'Failed to share document');
        return false;
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response?.status === 404) {
          toast.error('Document not found or access denied');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to share document');
        }
      } else {
        toast.error('Failed to share document');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyDocument = async (documentId: string): Promise<boolean> => {
    if (!authState.token) {
      toast.error('Please log in to verify documents');
      return false;
    }

    try {
      setIsLoading(true);

      // Get document from local state first for validation
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      toast.info("Connecting to blockchain network...");

      // Create axios instance for verification service
      const VERIFICATION_API_URL = `${API_BASE_URL}/api/verification`;
      const api = createAuthenticatedAxios(authState.token);
      api.defaults.baseURL = VERIFICATION_API_URL;

      toast.info("Retrieving transaction details...");

      // Call verification service API for blockchain verification
      const response = await api.post(`/${documentId}/verify`);

      if (response.data.success) {
        toast.success('Document verified on blockchain');

        // Refresh documents to get updated state from backend
        await refreshDocuments();

        return true;
      } else {
        toast.error(response.data.message || 'Document verification failed');
        return false;
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response?.status === 404) {
          toast.error('Document not found or verification data unavailable');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to verify document');
        }
      } else {
        toast.error('Failed to verify document');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDocument = async (documentId: string, reason: string): Promise<boolean> => {
    if (!authState.token) {
      toast.error('Please log in to revoke documents');
      return false;
    }

    try {
      setIsLoading(true);

      // Get document from local state first for validation
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        toast.error("Document not found");
        return false;
      }

      toast.info("Preparing revocation transaction...");

      // Create axios instance for document service
      const api = createAuthenticatedAxios(authState.token);

      // Prepare revocation data
      const revocationData = {
        reason,
        timestamp: new Date().toISOString()
      };

      toast.info("Sending revocation to blockchain...");

      // Call document service API for revocation
      const response = await api.post(`/${documentId}/revoke`, revocationData);

      if (response.data.success) {
        toast.success('Document has been revoked');

        // Refresh documents to get updated state from backend
        await refreshDocuments();

        return true;
      } else {
        toast.error(response.data.message || 'Failed to revoke document');
        return false;
      }
    } catch (error) {
      console.error('Error revoking document:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please log in again.');
        } else if (error.response?.status === 404) {
          toast.error('Document not found or access denied');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Failed to revoke document');
        }
      } else {
        toast.error('Failed to revoke document');
      }
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
