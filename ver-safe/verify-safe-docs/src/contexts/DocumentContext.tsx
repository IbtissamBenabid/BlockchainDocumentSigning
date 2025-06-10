
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  Document, 
  DocumentStatus, 
  SecurityLevel,
  SignatureType,
  VerificationMethod
} from '@/types/document';
import { toast } from 'sonner';

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
}

// Mock blockchain hash generation - more complex with different algorithms
const generateHash = () => {
  // Simulate multiple hashing algorithms (SHA-256, SHA-3, etc)
  const algorithms = ['SHA-256', 'SHA-3', 'BLAKE2'];
  const selectedAlgo = algorithms[Math.floor(Math.random() * algorithms.length)];
  
  // Generate a more complex hash
  const hash = Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return `${selectedAlgo}:${hash}`;
};

// Mock blockchain transaction ID - with network identifier
const generateTxId = () => {
  const networks = ['ETH', 'BSC', 'POLYGON', 'SOLANA'];
  const network = networks[Math.floor(Math.random() * networks.length)];
  
  const txId = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return `${network}:${txId}`;
};

// More complex verification with multiple steps
const verifyOnBlockchain = async (hash: string) => {
  // Simulate multi-step verification process
  await new Promise(resolve => setTimeout(resolve, 500)); // Step 1: Connect to network
  await new Promise(resolve => setTimeout(resolve, 700)); // Step 2: Retrieve transaction
  await new Promise(resolve => setTimeout(resolve, 300)); // Step 3: Verify hash
  
  // 95% success rate for verification
  const verified = Math.random() > 0.05;
  
  return {
    verified,
    blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
    confirmations: Math.floor(Math.random() * 50) + 1,
    networkId: Math.floor(Math.random() * 4) + 1,
    gasUsed: Math.floor(Math.random() * 200000) + 50000,
  };
};

const DocumentContext = createContext<DocumentContextProps | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load documents from local storage on mount
  useEffect(() => {
    const loadDocuments = () => {
      try {
        const savedDocuments = localStorage.getItem('documents');
        if (savedDocuments) {
          setDocuments(JSON.parse(savedDocuments));
        }
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, []);

  // Save documents to local storage whenever they change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('documents', JSON.stringify(documents));
    }
  }, [documents]);

  const uploadDocument = async (
    file: File, 
    title: string, 
    securityLevel: SecurityLevel = SecurityLevel.MEDIUM
  ): Promise<Document | null> => {
    try {
      setIsLoading(true);
      
      // Simulate more complex blockchain processing with multiple steps
      toast.info("Preparing document for blockchain...");
      await new Promise(resolve => setTimeout(resolve, 700));
      
      toast.info("Generating document hash...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hash = generateHash();
      
      toast.info("Registering on blockchain network...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const txId = generateTxId();
      
      const newDocument: Document = {
        id: Date.now().toString(),
        title: title || file.name,
        fileName: file.name,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
        status: DocumentStatus.UPLOADED,
        hash,
        blockchainTxId: txId,
        signatures: [],
        sharedWith: [],
        securityLevel,
        metadata: {
          createdBy: "Demo User",
          createdAt: new Date().toISOString(),
          pageCount: Math.floor(Math.random() * 10) + 1,
          size: file.size,
          version: 1,
          contentHash: hash.split(':')[1].substring(0, 32),
          signaturesRequired: securityLevel === SecurityLevel.CRITICAL ? 2 : 1
        },
        verificationHistory: [
          {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            verifierId: "system",
            verifierName: "System",
            verified: true,
            verificationMethod: VerificationMethod.HASH_COMPARISON,
            details: "Initial upload verification"
          }
        ]
      };
      
      setDocuments(prev => [...prev, newDocument]);
      toast.success('Document uploaded and registered on blockchain');
      return newDocument;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
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
    try {
      setIsLoading(true);
      
      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error("Document not found");
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
      
      // More complex signing process with multiple steps
      toast.info("Preparing signature for blockchain registration...");
      await new Promise(resolve => setTimeout(resolve, 700));
      
      toast.info("Computing cryptographic proof...");
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast.info("Sending transaction to blockchain...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const verificationResult = await verifyOnBlockchain(document.hash || "");
      
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
              userId: '1', // In real app, this would be the current user's ID
              userName: 'Demo User', // In real app, this would be the current user's name
              timestamp: new Date().toISOString(),
              signatureDataUrl,
              signatureType: SignatureType.ELECTRONIC,
              verified: verificationResult.verified,
              ...signatureMetadata
            },
          ];
          
          const updatedVerificationHistory = [
            ...(doc.verificationHistory || []),
            {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              verifierId: '1',
              verifierName: 'Demo User',
              verified: verificationResult.verified,
              verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION,
              details: `Signature verification: ${verificationResult.verified ? 'Success' : 'Failed'}`
            }
          ];
          
          return {
            ...doc,
            signatures: updatedSignatures,
            verificationHistory: updatedVerificationHistory,
            status: newStatus,
            blockchainTxId: generateTxId(),
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
    try {
      setIsLoading(true);
      
      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      
      // Check if document can be shared
      if (document.status === DocumentStatus.REVOKED) {
        toast.error("This document has been revoked and cannot be shared");
        return false;
      }
      
      // More complex sharing process
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
              verifierId: '1',
              verifierName: 'Demo User',
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
    try {
      setIsLoading(true);
      
      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      
      // More complex verification process
      toast.info("Connecting to blockchain network...");
      await new Promise(resolve => setTimeout(resolve, 600));
      
      toast.info("Retrieving transaction details...");
      await new Promise(resolve => setTimeout(resolve, 700));
      
      toast.info("Verifying cryptographic proofs...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const verificationResult = await verifyOnBlockchain(document.hash || "");
      
      if (!verificationResult.verified) {
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
              verifierId: '1',
              verifierName: 'Demo User',
              verified: verificationResult.verified,
              verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION,
              details: `Blockchain verification: Block ${verificationResult.blockNumber}, ${verificationResult.confirmations} confirmations`
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

  // New function to revoke documents
  const revokeDocument = async (documentId: string, reason: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Get document
      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      
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
              verifierId: '1',
              verifierName: 'Demo User',
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
