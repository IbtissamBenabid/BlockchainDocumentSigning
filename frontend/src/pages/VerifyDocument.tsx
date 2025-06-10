
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChevronLeft, FileText, Check, X, Clock, Share2 } from 'lucide-react';
import { useDocuments } from '@/contexts/DocumentContext';
import { DocType, DocumentStatus } from '@/types/document'; // Using DocType instead of Document
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const VerifyDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocumentById, verifyDocument, isLoading } = useDocuments();
  const [document, setDocument] = useState<DocType | undefined>(); // Using DocType instead of Document
  const [verificationResult, setVerificationResult] = useState<'success' | 'failure' | 'pending' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (id) {
      const doc = getDocumentById(id);
      if (doc) {
        setDocument(doc);
        if (doc.status === DocumentStatus.VERIFIED) {
          setVerificationResult('success');
        } else {
          setVerificationResult('pending');
        }
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }, [id, getDocumentById, navigate]);

  const handleVerify = async () => {
    if (!id) return;
    
    setIsVerifying(true);
    try {
      const success = await verifyDocument(id);
      setVerificationResult(success ? 'success' : 'failure');
      
      // Refresh document data
      const updatedDoc = getDocumentById(id);
      setDocument(updatedDoc);
    } catch (error) {
      console.error('Error verifying document:', error);
      setVerificationResult('failure');
    } finally {
      setIsVerifying(false);
    }
  };

  // Show AI-powered information about the verification if available
  const renderAIInsights = () => {
    if (!document?.aiClassification && !document?.securityAnalysis) return null;
    
    return (
      <div className="mt-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">AI-Powered Insights</h3>
        
        {document.aiClassification && (
          <div className="mb-3 p-3 bg-blue-50 rounded-md">
            <p className="font-medium text-blue-700">Document Type: {document.aiClassification.documentType}</p>
            <p className="text-sm text-blue-600">Confidence: {(document.aiClassification.confidenceScore * 100).toFixed(1)}%</p>
            {document.aiClassification.suggestedTags && document.aiClassification.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {document.aiClassification.suggestedTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {document.securityAnalysis && (
          <div className={`p-3 rounded-md ${
            document.securityAnalysis.riskScore < 25 ? 'bg-green-50' : 
            document.securityAnalysis.riskScore < 50 ? 'bg-yellow-50' : 
            'bg-red-50'
          }`}>
            <div className="flex items-center">
              <p className="font-medium mr-2">Security Risk Score:</p>
              <div className="w-full max-w-[150px] h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    document.securityAnalysis.riskScore < 25 ? 'bg-green-500' : 
                    document.securityAnalysis.riskScore < 50 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  }`}
                  style={{width: `${document.securityAnalysis.riskScore}%`}}
                ></div>
              </div>
              <span className="ml-2 font-bold">
                {document.securityAnalysis.riskScore}/100
              </span>
            </div>
            
            {document.securityAnalysis.potentialIssues && document.securityAnalysis.potentialIssues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Potential Issues:</p>
                <ul className="text-xs mt-1">
                  {document.securityAnalysis.potentialIssues.map((issue, i) => (
                    <li key={i} className="flex gap-1">
                      <span className={`font-medium ${
                        issue.severity === 'LOW' ? 'text-green-700' :
                        issue.severity === 'MEDIUM' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>{issue.severity}:</span>
                      <span>{issue.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Verify Document</h1>
        </div>
      
        {document && (
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    <CardTitle>{document.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{document.fileName}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {verificationResult === 'success' ? (
                  <Alert className="border-green-500 bg-green-50">
                    <Check className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-700">Document Verified</AlertTitle>
                    <AlertDescription className="text-green-700">
                      This document has been verified on the blockchain and its integrity is confirmed.
                    </AlertDescription>
                  </Alert>
                ) : verificationResult === 'failure' ? (
                  <Alert className="border-red-500 bg-red-50">
                    <X className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-700">Verification Failed</AlertTitle>
                    <AlertDescription className="text-red-700">
                      This document could not be verified. It may have been tampered with or the blockchain record is not available.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Clock className="h-5 w-5" />
                    <AlertTitle>Not Verified Yet</AlertTitle>
                    <AlertDescription>
                      This document has not been verified on the blockchain yet. Click the verify button to check its integrity.
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Render AI insights */}
                {renderAIInsights()}
                
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Uploaded On</h3>
                      <p>{format(new Date(document.uploadedAt), 'PPP pp')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <p>{document.status}</p>
                    </div>
                  </div>
                  
                  {document.blockchainTxId && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Blockchain Transaction ID</h3>
                        <p className="font-mono text-xs break-all">{document.blockchainTxId}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Document Hash</h3>
                        <p className="font-mono text-xs break-all">{document.hash}</p>
                      </div>
                    </>
                  )}
                  
                  {/* Show ZK-proof verification if available */}
                  {document.blockchainTxId && document.verificationHistory && 
                   document.verificationHistory.some(v => v.verificationMethod === 'ZERO_KNOWLEDGE_PROOF') && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Zero-Knowledge Verification</h3>
                      <div className="p-2 bg-indigo-50 rounded mt-1">
                        <p className="text-sm text-indigo-700">
                          This document has been verified using zero-knowledge proofs, allowing verification without revealing document contents.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {document.signatures && document.signatures.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Signatures</h3>
                      <div className="space-y-2">
                        {document.signatures.map((signature, index) => (
                          <div key={signature.id} className="border rounded p-3">
                            <div className="flex justify-between">
                              <span className="font-medium">{signature.userName}</span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(signature.timestamp), 'PPP')}
                              </span>
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                {signature.signatureType}
                              </span>
                              {signature.biometricData && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                  BIOMETRIC: {signature.biometricData.type}
                                </span>
                              )}
                            </div>
                            {signature.signatureDataUrl && (
                              <div className="mt-2 border p-2 bg-white">
                                <img 
                                  src={signature.signatureDataUrl} 
                                  alt={`Signature ${index + 1}`}
                                  className="max-h-16" 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Dynamic smart document conditions if available */}
                  {document.conditions && document.conditions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Smart Document Conditions</h3>
                      <div className="space-y-2">
                        {document.conditions.map((condition) => (
                          <div key={condition.id} className="border rounded p-3">
                            <div className="flex justify-between">
                              <span className="font-medium">{condition.description}</span>
                              <span className={`text-sm px-2 py-0.5 rounded ${
                                condition.status === 'MET' ? 'bg-green-100 text-green-800' : 
                                condition.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {condition.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {condition.type}
                              {condition.evaluationTimestamp && ` • Last evaluated: ${format(new Date(condition.evaluationTimestamp), 'PPP')}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 mt-8">
                  {verificationResult !== 'success' && (
                    <Button 
                      onClick={handleVerify} 
                      disabled={isVerifying}
                      className="flex-1"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify on Blockchain'}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/share/${document.id}`)}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" /> Share Document
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Public Verification Link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Share this link with others to allow them to verify this document:
                </p>
                <div className="flex">
                  <input
                    readOnly
                    className="flex-1 p-2 border rounded-l bg-gray-50 text-sm font-mono"
                    value={`${window.location.origin}/public/verify/${document.id}`}
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/public/verify/${document.id}`);
                    }}
                    className="rounded-l-none"
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default VerifyDocument;
