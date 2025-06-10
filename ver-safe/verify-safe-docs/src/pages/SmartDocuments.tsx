
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDocuments } from '@/contexts/DocumentContext';
import { 
  FileCheck, 
  Plus, 
  Calendar, 
  Clock, 
  ArrowRight,
  DatabaseIcon,
  Workflow,
  Code,
  Webhook,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Smart document template interface
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'simple' | 'medium' | 'complex';
  triggers: string[];
  conditions: string[];
}

const SmartDocuments: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates');
  const { documents } = useDocuments();
  
  // Mock templates
  const templates: Template[] = [
    {
      id: '1',
      name: 'Auto-Expiring NDA',
      description: 'Non-disclosure agreement that automatically expires after a set period',
      category: 'Legal',
      complexity: 'simple',
      triggers: ['Time-based expiration'],
      conditions: ['Date condition']
    },
    {
      id: '2',
      name: 'Multi-Party Contract',
      description: 'Contract that requires signatures from multiple parties in sequence',
      category: 'Legal',
      complexity: 'medium',
      triggers: ['Signature completion'],
      conditions: ['All parties signed']
    },
    {
      id: '3',
      name: 'Data-Triggered Agreement',
      description: 'Document that updates terms based on external data feeds',
      category: 'Financial',
      complexity: 'complex',
      triggers: ['External API data', 'Market conditions'],
      conditions: ['Price thresholds', 'Time conditions']
    },
    {
      id: '4',
      name: 'Compliance Certificate',
      description: 'Auto-renewing compliance documentation with verification checks',
      category: 'Regulatory',
      complexity: 'medium',
      triggers: ['Periodic renewal', 'Compliance check'],
      conditions: ['Verification status', 'Time period']
    }
  ];
  
  // Mock active smart documents
  const [activeSmartDocs, setActiveSmartDocs] = useState([
    {
      id: '101',
      name: 'Vendor Agreement 2025',
      template: 'Auto-Expiring NDA',
      status: 'active',
      progress: 40,
      nextTrigger: 'Expiration in 45 days',
      createdAt: '2025-03-15'
    },
    {
      id: '102',
      name: 'Partner Contract',
      template: 'Multi-Party Contract',
      status: 'pending_action',
      progress: 70,
      nextTrigger: 'Awaiting signature from Party B',
      createdAt: '2025-04-10'
    }
  ]);

  const handleCreateSmartDocument = (templateId: string) => {
    toast.info(`Preparing smart document template ${templateId}`);
    
    // In a real app, you would navigate to a creation page with the selected template
    setTimeout(() => {
      toast.success('Smart document template loaded');
    }, 1000);
  };

  const handleMonitorDocument = (docId: string) => {
    toast.info(`Opening monitoring dashboard for document ${docId}`);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileCheck className="h-7 w-7 text-primary mr-3" />
            <h1 className="text-2xl font-bold">Smart Documents</h1>
          </div>
          <Button onClick={() => setActiveTab('templates')}>
            <Plus className="h-4 w-4 mr-2" />
            New Smart Document
          </Button>
        </div>

        <Tabs defaultValue="templates" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="active">Active Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map(template => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className={
                        template.complexity === 'simple' ? 'bg-green-100 text-green-800 border-green-200' :
                        template.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-orange-100 text-orange-800 border-orange-200'
                      }>
                        {template.complexity.charAt(0).toUpperCase() + template.complexity.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Category</div>
                        <div className="text-sm">{template.category}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-1">Triggers</div>
                        <div className="flex flex-wrap gap-1">
                          {template.triggers.map((trigger, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-1">Conditions</div>
                        <div className="flex flex-wrap gap-1">
                          {template.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-800">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => handleCreateSmartDocument(template.id)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Create Custom Template Card */}
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle>Create Custom Template</CardTitle>
                  <CardDescription>
                    Build a smart document from scratch with custom rules and triggers
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                  <Button variant="outline" className="border-dashed">
                    <Plus className="h-5 w-5 mr-2" />
                    Start Building
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="space-y-6">
              {activeSmartDocs.length === 0 ? (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Active Smart Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first smart document using one of our templates
                  </p>
                  <Button onClick={() => setActiveTab('templates')}>
                    Browse Templates
                  </Button>
                </div>
              ) : (
                activeSmartDocs.map(doc => (
                  <Card key={doc.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{doc.name}</CardTitle>
                          <CardDescription>Based on: {doc.template}</CardDescription>
                        </div>
                        <Badge className={
                          doc.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                          doc.status === 'pending_action' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }>
                          {doc.status === 'active' ? 'Active' : 
                           doc.status === 'pending_action' ? 'Action Required' : 
                           'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Progress</div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${doc.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>Created</span>
                            </div>
                            <div className="font-medium">{doc.createdAt}</div>
                          </div>
                          <div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Next Event</span>
                            </div>
                            <div className="font-medium">{doc.nextTrigger}</div>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleMonitorDocument(doc.id)}
                          >
                            Monitor
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Document History & Events</CardTitle>
                <CardDescription>
                  Track the history of your smart document events and triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative pl-6 border-l border-gray-200">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1"></div>
                    <div className="mb-1">
                      <span className="font-medium">Vendor Agreement 2025</span>
                      <span className="text-sm text-muted-foreground ml-2">today at 11:32 AM</span>
                    </div>
                    <div className="text-sm">
                      Automatic reminder sent to all parties
                    </div>
                  </div>
                  
                  <div className="relative pl-6 border-l border-gray-200">
                    <div className="absolute w-3 h-3 bg-yellow-500 rounded-full -left-[6.5px] top-1"></div>
                    <div className="mb-1">
                      <span className="font-medium">Partner Contract</span>
                      <span className="text-sm text-muted-foreground ml-2">yesterday at 3:45 PM</span>
                    </div>
                    <div className="text-sm">
                      Conditional clause triggered based on external data feed
                    </div>
                  </div>
                  
                  <div className="relative pl-6 border-l border-gray-200">
                    <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[6.5px] top-1"></div>
                    <div className="mb-1">
                      <span className="font-medium">Partner Contract</span>
                      <span className="text-sm text-muted-foreground ml-2">Apr 27, 2025</span>
                    </div>
                    <div className="text-sm">
                      Document verification completed by all parties
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Smart Document Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Time-Based Triggers</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Documents that automatically update based on time conditions
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <DatabaseIcon className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Data Integration</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Connect documents to external data sources and APIs
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Workflow className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Custom Workflows</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Define complex business rules and document flows
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Code className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Conditional Logic</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create dynamic document content based on conditions
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Webhook className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Webhooks & Events</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Trigger external systems when document events occur
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Zap className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Automated Actions</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create self-executing document processes
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SmartDocuments;
