
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, FileText, Share2, Check, Mail } from 'lucide-react';
import { useDocuments } from '@/contexts/DocumentContext';
import { Document } from '@/types/document';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ShareDocument: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocumentById, shareDocument, isLoading } = useDocuments();
  const [document, setDocument] = useState<Document | undefined>();
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (id) {
      const doc = getDocumentById(id);
      if (doc) {
        setDocument(doc);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  }, [id, getDocumentById, navigate]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !email) return;
    
    setIsSharing(true);
    try {
      const success = await shareDocument(id, email);
      if (success) {
        setEmail('');
        
        // Refresh document data
        const updatedDoc = getDocumentById(id);
        setDocument(updatedDoc);
      }
    } catch (error) {
      console.error('Error sharing document:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyLink = () => {
    if (!document) return;
    
    const link = `${window.location.origin}/public/verify/${document.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Verification link copied to clipboard');
    
    setTimeout(() => {
      setCopiedLink(false);
    }, 3000);
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
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
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
          <h1 className="text-2xl font-bold">Share Document</h1>
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
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share via Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShare}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Recipient Email</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="name@example.com"
                              className="pl-10"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                          <Button 
                            type="submit" 
                            disabled={!email || isSharing}
                          >
                            {isSharing ? 'Sending...' : 'Share'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                  
                  {document.sharedWith && document.sharedWith.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium mb-2">Shared With</h3>
                      <div className="space-y-2">
                        {document.sharedWith.map((email, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>{email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Share Verification Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Anyone with this link can verify the document's authenticity on the blockchain:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 border rounded bg-gray-50 text-sm font-mono truncate">
                      {`${window.location.origin}/public/verify/${document.id}`}
                    </div>
                    <Button onClick={copyLink}>
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  
                  <div className="mt-6 p-4 border rounded bg-gray-50">
                    <h3 className="font-medium flex items-center gap-2 mb-2">
                      <Share2 className="h-4 w-4" /> QR Code Verification
                    </h3>
                    <div className="bg-white p-4 flex justify-center">
                      {/* Placeholder for QR code - in a real app, would use a QR code library */}
                      <div className="w-32 h-32 border-2 border-dashed rounded flex items-center justify-center">
                        <p className="text-xs text-center text-muted-foreground">QR Code Placeholder</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Scan to verify document authenticity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ShareDocument;
