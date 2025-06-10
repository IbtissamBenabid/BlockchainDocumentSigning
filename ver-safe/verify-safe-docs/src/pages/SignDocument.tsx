import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  FileText, 
  ChevronLeft, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';
import { useDocuments } from '@/contexts/DocumentContext';
import { 
  DocType, 
  DocumentStatus, 
  SecurityLevel, 
  SignatureType,
  VerificationMethod 
} from '@/types/document';
import SignaturePad from '@/components/SignaturePad';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const SignDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocumentById, signDocument, isLoading } = useDocuments();
  const [document, setDocument] = useState<DocType | undefined>();
  const [signatureMethod, setSignatureMethod] = useState<'draw' | 'type'>('draw');
  const [typeSignature, setTypeSignature] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>(SecurityLevel.MEDIUM);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);

  useEffect(() => {
    if (id) {
      const doc = getDocumentById(id);
      if (doc) {
        setDocument(doc);
        // Set initial security level based on document's existing setting
        if (doc.securityLevel) {
          setSecurityLevel(doc.securityLevel);
        }
        
        // Check if document is eligible for signing
        if (doc.status === DocumentStatus.REVOKED) {
          toast.error("This document has been revoked and cannot be signed");
        } else if (doc.status === DocumentStatus.EXPIRED) {
          toast.error("This document has expired and cannot be signed");
        }
      } else {
        navigate('/dashboard');
      }
    } else {
      // If no document ID provided, show document selection
      navigate('/dashboard');
    }
  }, [id, getDocumentById, navigate]);

  // Generate a device fingerprint for enhanced security
  const getDeviceInfo = useCallback(() => {
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    
    return `${platform} | ${screenInfo} | ${language} | ${timezone}`;
  }, []);

  const handleSignatureCapture = async (signatureDataUrl: string) => {
    if (!id) return;
    
    setIsProcessing(true);
    try {
      // Enhanced signature object with more metadata
      const signatureData = {
        signatureDataUrl,
        signatureType: SignatureType.ELECTRONIC,
        ipAddress: "192.168.1.1", // In a real app, you'd get this from server
        deviceInfo: getDeviceInfo(),
        securityLevel,
        verificationMethod: VerificationMethod.BLOCKCHAIN_VERIFICATION
      };
      
      const success = await signDocument(id, signatureDataUrl, signatureData);
      
      if (success) {
        // Refresh document data
        const updatedDoc = getDocumentById(id);
        setDocument(updatedDoc);
        
        // Navigate to verification with success message
        toast.success("Document signed successfully and registered on blockchain!");
        navigate(`/verify/${id}`);
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error('Failed to sign document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTypeSignatureSubmit = () => {
    if (!typeSignature.trim()) return;
    
    // Convert text to image (simple canvas solution)
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '32px cursive';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typeSignature, canvas.width / 2, canvas.height / 2);
      
      const signatureDataUrl = canvas.toDataURL('image/png');
      handleSignatureCapture(signatureDataUrl);
    }
  };

  const handleSecurityLevelChange = (level: SecurityLevel) => {
    setSecurityLevel(level);
    
    if (level === SecurityLevel.LOW) {
      setShowSecurityWarning(true);
    } else {
      setShowSecurityWarning(false);
    }
  };

  const renderSecurityLevelBadge = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.LOW:
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Low Security</Badge>;
      case SecurityLevel.MEDIUM:
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Security</Badge>;
      case SecurityLevel.HIGH:
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">High Security</Badge>;
      case SecurityLevel.CRITICAL:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Critical Security</Badge>;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Sign Document</h1>
          {document?.securityLevel && (
            <div className="ml-auto">
              {renderSecurityLevelBadge(document.securityLevel)}
            </div>
          )}
        </div>
      
        {document && (
          <div className="max-w-3xl mx-auto">
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-primary" />
                    <div>
                      <CardTitle>{document.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{document.fileName}</p>
                    </div>
                  </div>
                  <Badge 
                    className={
                      document.status === DocumentStatus.UPLOADED ? "bg-gray-500" :
                      document.status === DocumentStatus.SIGNED ? "bg-green-600" :
                      document.status === DocumentStatus.VERIFIED ? "bg-blue-600" :
                      document.status === DocumentStatus.REVOKED ? "bg-red-600" :
                      "bg-amber-500"
                    }
                  >
                    {document.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="my-6 p-4 bg-gray-50 rounded document-preview min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Document Preview</p>
                  </div>
                </div>
                
                {document.hash && (
                  <div className="mt-4 p-2 bg-gray-50 rounded text-xs font-mono overflow-auto">
                    <p>Document Hash:</p>
                    <p className="mt-1">{document.hash}</p>
                  </div>
                )}
                
                {/* Document metadata display */}
                {document.metadata && (
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm border rounded-md p-3 bg-gray-50">
                    <div>
                      <span className="text-muted-foreground">Created:</span> 
                      {new Date(document.metadata.createdAt).toLocaleDateString()}
                    </div>
                    {document.metadata.pageCount && (
                      <div>
                        <span className="text-muted-foreground">Pages:</span> 
                        {document.metadata.pageCount}
                      </div>
                    )}
                    {document.metadata.version && (
                      <div>
                        <span className="text-muted-foreground">Version:</span> 
                        {document.metadata.version}
                      </div>
                    )}
                    {document.metadata.size && (
                      <div>
                        <span className="text-muted-foreground">Size:</span> 
                        {Math.round(document.metadata.size / 1024)} KB
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Security Level Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Level
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                <Button 
                  variant={securityLevel === SecurityLevel.LOW ? "default" : "outline"}
                  onClick={() => handleSecurityLevelChange(SecurityLevel.LOW)}
                  className="flex-col py-4 h-auto"
                >
                  <span>Low</span>
                  <span className="text-xs mt-1">Basic</span>
                </Button>
                <Button 
                  variant={securityLevel === SecurityLevel.MEDIUM ? "default" : "outline"}
                  onClick={() => handleSecurityLevelChange(SecurityLevel.MEDIUM)}
                  className="flex-col py-4 h-auto"
                >
                  <span>Medium</span>
                  <span className="text-xs mt-1">Standard</span>
                </Button>
                <Button 
                  variant={securityLevel === SecurityLevel.HIGH ? "default" : "outline"}
                  onClick={() => handleSecurityLevelChange(SecurityLevel.HIGH)}
                  className="flex-col py-4 h-auto"
                >
                  <span>High</span>
                  <span className="text-xs mt-1">Enhanced</span>
                </Button>
                <Button 
                  variant={securityLevel === SecurityLevel.CRITICAL ? "default" : "outline"}
                  onClick={() => handleSecurityLevelChange(SecurityLevel.CRITICAL)}
                  className="flex-col py-4 h-auto"
                >
                  <span>Critical</span>
                  <span className="text-xs mt-1">Maximum</span>
                </Button>
              </div>
              
              {showSecurityWarning && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Warning</AlertTitle>
                  <AlertDescription>
                    Low security level provides minimal protection and may not be suitable for important documents.
                  </AlertDescription>
                </Alert>
              )}
              
              {securityLevel === SecurityLevel.CRITICAL && (
                <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Enhanced Security Enabled</AlertTitle>
                  <AlertDescription>
                    Critical security mode uses advanced blockchain validation and multi-factor verification.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Add Your Signature</h3>
            
            <Tabs defaultValue="draw" onValueChange={(value) => setSignatureMethod(value as 'draw' | 'type')}>
              <TabsList className="mb-6">
                <TabsTrigger value="draw">Draw Signature</TabsTrigger>
                <TabsTrigger value="type">Type Signature</TabsTrigger>
              </TabsList>
              
              <TabsContent value="draw">
                <div className="mb-6">
                  <p className="mb-4 text-muted-foreground">
                    Use your mouse or touch screen to draw your signature below.
                  </p>
                  <div className="bg-white rounded-lg overflow-hidden">
                    <SignaturePad onSave={handleSignatureCapture} />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="type">
                <div className="mb-6">
                  <p className="mb-4 text-muted-foreground">
                    Type your name below to create a signature.
                  </p>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={typeSignature}
                      onChange={(e) => setTypeSignature(e.target.value)}
                      className="w-full p-4 text-2xl font-cursive border rounded-lg"
                      placeholder="Type your signature here"
                      style={{ fontFamily: 'cursive' }}
                    />
                    <Button 
                      onClick={handleTypeSignatureSubmit}
                      disabled={!typeSignature.trim() || isProcessing}
                      className="min-w-[120px]"
                    >
                      {isProcessing ? 'Processing...' : 'Apply Signature'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SignDocument;
