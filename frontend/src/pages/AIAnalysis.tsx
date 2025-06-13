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
  FileText,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Info,
  CircleDot,
  Clock,
  BookOpen,
  FileType,
  Calendar,
  TrendingUp,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

const AIAnalysis: React.FC = () => {
  const { documents } = useDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');

  const [insights, setInsights] = useState<any>({
    riskScore: 0,
    contentSummary: '',
    keyTerms: [],
    anomalies: [],
    recommendations: [],
    metadata: {
      pageCount: 0,
      wordCount: 0,
      characterCount: 0,
      documentType: '',
      analysisDate: '',
      processingTime: '',
      fileSize: '',
      creationDate: '',
      lastModified: ''
    }
  });

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setAnalysisComplete(false);
    setInsights({
      riskScore: 0,
      contentSummary: '',
      keyTerms: [],
      anomalies: [],
      recommendations: [],
      metadata: {
        pageCount: 0,
        wordCount: 0,
        characterCount: 0,
        documentType: '',
        analysisDate: '',
        processingTime: '',
        fileSize: '',
        creationDate: '',
        lastModified: ''
      }
    });
  };

  const handleStartAnalysis = async () => {
    if (!selectedDocumentId) return;

    setIsAnalyzing(true);
    toast.info("AI analysis started");
    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:8500/api/ai/analyze-document/${selectedDocumentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'versafe-internal-api-key-2024'
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analysis results");
      }

      const data = await response.json();
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Map the API response to your insights state shape
      setInsights({
        riskScore: data.risk_score ?? 0,
        contentSummary: data.result ?? 'No summary available',
        keyTerms: data.key_terms ?? [], // Try to get from API
        anomalies: data.anomalies ?? [], // Try to get from API
        recommendations: data.recommendations ?? [], // Try to get from API
        metadata: {
          pageCount: data.features?.pages ?? data.pages ?? 0,
          wordCount: data.features?.wordCount ?? data.wordCount ?? 0,
          characterCount: data.features?.character_count ?? data.character_count ?? 0,
          documentType: data.features?.document_type ?? data.document_type ?? 'Unknown',
          analysisDate: new Date().toLocaleString(),
          processingTime: `${processingTime}s`,
          fileSize: data.features?.file_size ?? data.file_size ?? 'Unknown',
          creationDate: data.features?.creation_date ?? data.creation_date ?? 'Unknown',
          lastModified: data.features?.last_modified ?? data.last_modified ?? 'Unknown'
        }
      });

      setAnalysisComplete(true);
      toast.success("AI analysis completed");
      setActiveTab('insights');

    } catch (error) {
      console.error(error);
      toast.error("Error analyzing document");
    } finally {
      setIsAnalyzing(false);
    }
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

  const formatFileSize = (size: string | number) => {
    if (typeof size === 'string' && size !== 'Unknown') return size;
    if (typeof size === 'number') {
      const units = ['B', 'KB', 'MB', 'GB'];
      let unitIndex = 0;
      let fileSize = size;
      
      while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024;
        unitIndex++;
      }
      
      return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
    }
    return 'Unknown';
  };

  const formatDate = (dateString: string) => {
    if (dateString === 'Unknown' || !dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const selectedDocument = documents.find(doc => doc.id === selectedDocumentId) ?? null;
  const riskInfo = renderRiskLevel(insights.riskScore);

  // Debug logs (remove or comment out in production)
  console.log('Selected Document:', selectedDocument);
  console.log('Insights:', insights);
  console.log('Active Tab:', activeTab);

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
                      <Progress value={50} className="w-3/4 mx-auto" />
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
            ) : analysisComplete && selectedDocument ? (
              <div className="space-y-6">
                {/* Analysis Header with Metadata */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                          Analysis Complete
                          {insights.anomalies.length > 0 && (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 ml-2" />
                          )}
                        </CardTitle>
                        <CardDescription>
                          {selectedDocument.title} • {insights.metadata.analysisDate}
                        </CardDescription>
                      </div>
                      {riskInfo.badge}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm font-medium text-blue-800">Risk Score</div>
                        <div className={`text-xl font-bold ${riskInfo.color}`}>{insights.riskScore}/100</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <div className="text-sm font-medium text-green-800">Pages</div>
                        <div className="text-xl font-bold text-green-700">{insights.metadata.pageCount || 'N/A'}</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Hash className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <div className="text-sm font-medium text-purple-800">Words</div>
                        <div className="text-xl font-bold text-purple-700">
                          {insights.metadata.wordCount ? insights.metadata.wordCount.toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                        <div className="text-sm font-medium text-orange-800">Processing</div>
                        <div className="text-xl font-bold text-orange-700">{insights.metadata.processingTime}</div>
                      </div>
                    </div>

                    {/* Risk Assessment Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span>Risk Assessment</span>
                        <span>{riskInfo.label}</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${riskInfo.bgColor}`}
                          style={{ width: `${insights.riskScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Results */}
                <Card>
                  <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-6">
                        <TabsTrigger value="insights">Insights</TabsTrigger>
                        <TabsTrigger value="metadata">Metadata</TabsTrigger>
                        <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                        <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                      </TabsList>

                      <TabsContent value="insights">
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold mb-3 text-lg">Content Summary</h4>
                            <p className="text-gray-700 leading-relaxed">{insights.contentSummary}</p>
                          </div>

                          {insights.keyTerms.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3 text-lg">Key Terms</h4>
                              <div className="flex flex-wrap gap-2">
                                {insights.keyTerms.map((term: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-blue-50 text-blue-800 border-blue-200 px-3 py-1"
                                  >
                                    {term}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="metadata">
                        <div className="space-y-6">
                          <h4 className="font-semibold text-lg mb-4">Document Metadata</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <FileType className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Document Type</div>
                                  <div className="font-semibold">{insights.metadata.documentType || 'Unknown'}</div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <BookOpen className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Page Count</div>
                                  <div className="font-semibold">{insights.metadata.pageCount || 'N/A'}</div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Hash className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Word Count</div>
                                  <div className="font-semibold">
                                    {insights.metadata.wordCount ? insights.metadata.wordCount.toLocaleString() : 'N/A'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <FileText className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Character Count</div>
                                  <div className="font-semibold">
                                    {insights.metadata.characterCount ? insights.metadata.characterCount.toLocaleString() : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <FileText className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">File Size</div>
                                  <div className="font-semibold">{formatFileSize(insights.metadata.fileSize)}</div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Created</div>
                                  <div className="font-semibold">{formatDate(insights.metadata.creationDate)}</div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Calendar className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Last Modified</div>
                                  <div className="font-semibold">{formatDate(insights.metadata.lastModified)}</div>
                                </div>
                              </div>
                              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                                <Clock className="h-5 w-5 text-gray-600 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-600">Analysis Time</div>
                                  <div className="font-semibold">{insights.metadata.processingTime}</div>
                                </div>
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
                                className="border-l-4"
                              >
                                <AlertTriangle className="h-5 w-5" />
                                <AlertTitle className="text-base font-semibold">
                                  {anomaly.type}
                                  <Badge
                                    variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}
                                    className="ml-2 text-xs"
                                  >
                                    {anomaly.severity}
                                  </Badge>
                                </AlertTitle>
                                <AlertDescription className="mt-2">
                                  {anomaly.description}
                                </AlertDescription>
                              </Alert>
                            ))
                          ) : (
                            <div className="flex items-center p-6 bg-green-50 rounded-lg border border-green-200">
                              <CheckCircle2 className="h-6 w-6 text-green-600 mr-3" />
                              <div>
                                <div className="font-semibold text-green-800">No Anomalies Detected</div>
                                <div className="text-green-700">This document appears to be clean and well-formatted.</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="recommendations">
                        <div className="space-y-4">
                          {insights.recommendations.length > 0 ? (
                            insights.recommendations.map((rec: string, index: number) => (
                              <div
                                key={index}
                                className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg"
                              >
                                <div className="flex items-start">
                                  <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-medium text-blue-900 mb-1">
                                      Recommendation {index + 1}
                                    </div>
                                    <div className="text-blue-800">{rec}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                              <Info className="h-6 w-6 text-gray-500 mr-3" />
                              <div>
                                <div className="font-semibold text-gray-700">No Specific Recommendations</div>
                                <div className="text-gray-600">The document appears to meet standard requirements.</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center p-8">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">Ready to Analyze</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Start Analysis" to begin AI-powered document examination
                  </p>
                  <Button
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing || !selectedDocumentId}
                  >
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