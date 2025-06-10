
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDocuments } from '@/contexts/DocumentContext';
import { 
  Brain, 
  ChevronLeft, 
  FileText, 
  Info,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  FileSearch,
  CircleDot
} from 'lucide-react';
import { toast } from 'sonner';

const AIAnalysis: React.FC = () => {
  const { documents } = useDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  
  // Mock analysis results
  const [insights, setInsights] = useState<any>({
    riskScore: 0,
    contentSummary: '',
    keyTerms: [],
    anomalies: [],
    recommendations: []
  });

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setAnalysisComplete(false);
    setInsights({
      riskScore: 0,
      contentSummary: '',
      keyTerms: [],
      anomalies: [],
      recommendations: []
    });
  };

  const handleStartAnalysis = () => {
    if (!selectedDocumentId) return;
    
    setIsAnalyzing(true);
    toast.info("AI analysis started");
    
    // Simulate AI analysis process
    setTimeout(() => {
      const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
      
      // Mock insights based on document properties
      const mockInsights = {
        riskScore: Math.floor(Math.random() * 100),
        contentSummary: `This appears to be a ${selectedDocument?.title.toLowerCase()} document that contains ${Math.floor(Math.random() * 5) + 1} pages of content related to blockchain authentication and digital signatures.`,
        keyTerms: [
          'Digital Signature',
          'Blockchain',
          'Authentication',
          'Verification',
          'Smart Contract',
          'Legal Compliance',
          'Data Protection'
        ],
        anomalies: Math.random() > 0.7 ? [
          {
            type: 'Potential Tampering',
            description: 'Minor inconsistencies detected in document metadata',
            severity: 'medium'
          }
        ] : [],
        recommendations: [
          'Add multi-factor authentication for document signatories',
          'Enable blockchain timestamp verification',
          'Consider upgrading security level to High for this document type'
        ]
      };
      
      setInsights(mockInsights);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      toast.success("AI analysis completed");
    }, 3000);
  };

  const renderRiskLevel = (score: number) => {
    if (score < 30) return { 
      label: "Low Risk", 
      color: "text-green-600",
      bgColor: "bg-green-500",
      badge: <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>
    };
    if (score < 70) return { 
      label: "Medium Risk", 
      color: "text-yellow-600",
      bgColor: "bg-yellow-500",
      badge: <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>
    };
    return { 
      label: "High Risk", 
      color: "text-red-600",
      bgColor: "bg-red-500",
      badge: <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>
    };
  };

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId);
  const riskInfo = renderRiskLevel(insights.riskScore);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Brain className="h-7 w-7 text-primary mr-3" />
          <h1 className="text-2xl font-bold">AI Document Analysis</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select Document</CardTitle>
                <CardDescription>Choose a document to analyze</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {documents.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      No documents available for analysis
                    </div>
                  ) : (
                    documents.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${selectedDocumentId === doc.id ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleSelectDocument(doc.id)}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                          <div>
                            <div className="font-medium">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">{doc.fileName}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {selectedDocumentId && !analysisComplete && (
                  <Button 
                    className="w-full mt-4" 
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            {!selectedDocumentId ? (
              <div className="h-full flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center p-8">
                  <FileSearch className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Select a document to analyze</h3>
                  <p className="text-muted-foreground">
                    AI analysis helps identify document risks, insights, and provides recommendations
                  </p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Analyzing Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="inline-block animate-pulse">
                        <Brain className="h-16 w-16 text-primary mx-auto" />
                      </div>
                      <h3 className="text-xl font-medium mt-4 mb-2">
                        AI Analysis in Progress
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Examining document contents and metadata...
                      </p>
                      <Progress value={Math.floor(Math.random() * 100)} className="w-3/4 mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <CircleDot className="h-3 w-3 text-green-500 mr-2" />
                        <span>Checking document integrity</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CircleDot className="h-3 w-3 text-green-500 mr-2" />
                        <span>Analyzing content structure</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CircleDot className="h-3 w-3 text-blue-500 animate-pulse mr-2" />
                        <span>Processing text for insights</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CircleDot className="h-3 w-3 text-gray-300 mr-2" />
                        <span>Generating recommendations</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : analysisComplete ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        Analysis Results
                        {insights.anomalies.length > 0 && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedDocument?.title}
                      </CardDescription>
                    </div>
                    {riskInfo.badge}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="text-sm font-medium mb-2">Risk Assessment</div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${riskInfo.bgColor}`}
                        style={{ width: `${insights.riskScore}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-xs text-right text-muted-foreground">
                      Score: {insights.riskScore}/100
                    </div>
                  </div>

                  <Tabs defaultValue="insights" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="insights">Insights</TabsTrigger>
                      <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                      <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="insights">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Content Summary</h4>
                          <p className="text-sm">{insights.contentSummary}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Key Terms</h4>
                          <div className="flex flex-wrap gap-2">
                            {insights.keyTerms.map((term: string, index: number) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="bg-blue-50 text-blue-800 border-blue-200"
                              >
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Smart Document Stats</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded">
                              <div className="text-xs text-muted-foreground">Compliance Score</div>
                              <div className="font-medium">{70 + Math.floor(Math.random() * 30)}%</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded">
                              <div className="text-xs text-muted-foreground">Complexity</div>
                              <div className="font-medium">Medium</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="anomalies">
                      <div className="space-y-4">
                        {insights.anomalies.length > 0 ? (
                          insights.anomalies.map((anomaly: any, index: number) => (
                            <Alert 
                              key={index} 
                              variant={anomaly.severity === 'high' ? 'destructive' : 'default'}
                            >
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>{anomaly.type}</AlertTitle>
                              <AlertDescription>
                                {anomaly.description}
                              </AlertDescription>
                            </Alert>
                          ))
                        ) : (
                          <div className="flex items-center p-4 bg-green-50 rounded-md">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                            <span>No anomalies detected in this document</span>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="recommendations">
                      <div className="space-y-3">
                        {insights.recommendations.map((rec: string, index: number) => (
                          <div 
                            key={index} 
                            className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded"
                          >
                            <div className="flex">
                              <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center p-8">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Start Analysis" to begin AI-powered document examination
                  </p>
                  <Button onClick={handleStartAnalysis}>
                    Start Analysis
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIAnalysis;
