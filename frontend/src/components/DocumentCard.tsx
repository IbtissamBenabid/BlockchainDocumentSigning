import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Document, DocumentStatus } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Check, Share2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface DocumentCardProps {
  document: Document;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const navigate = useNavigate();
  
  const renderStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return <Badge variant="outline">Uploaded</Badge>;
      case DocumentStatus.SIGNED:
        return <Badge variant="default" className="bg-green-500 text-white">Signed</Badge>;
      case DocumentStatus.VERIFIED:
        return <Badge variant="secondary" className="bg-blue-600 text-white">Verified</Badge>;
      case DocumentStatus.SHARED:
        return <Badge variant="outline" className="border-blue-400 text-blue-600">Shared</Badge>;
      case DocumentStatus.EXPIRED:
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-medium truncate max-w-[200px]">
              {document.title}
            </CardTitle>
          </div>
          {renderStatusBadge(document.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-sm text-muted-foreground mb-2">
          <p className="truncate">{document.fileName}</p>
          <p className="mt-1">Uploaded {formatDistanceToNow(new Date(document.uploadedAt))} ago</p>
        </div>
        
        {document.hash && (
          <div className="mt-2 px-2 py-1 bg-gray-50 rounded text-xs font-mono truncate">
            {document.hash.substring(0, 20)}...
          </div>
        )}
        
        {document.signatures && document.signatures.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">
              Signed by {document.signatures.length} {document.signatures.length === 1 ? 'person' : 'people'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-2">
        {document.status !== DocumentStatus.SIGNED && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/sign/${document.id}`)}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" /> Sign
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/verify/${document.id}`)}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-1" /> Verify
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate(`/share/${document.id}`)}
          className="flex-1"
        >
          <Share2 className="h-4 w-4 mr-1" /> Share
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentCard;
