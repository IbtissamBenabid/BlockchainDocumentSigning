
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Database, 
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileText,
  RefreshCw,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  complianceScore: number;
  lastChecked: string;
  category: string;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
}

const Compliance: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState('global');
  
  // Mock compliance standards data
  const complianceStandards: ComplianceStandard[] = [
    {
      id: '1',
      name: 'GDPR',
      description: 'General Data Protection Regulation',
      complianceScore: 92,
      lastChecked: 'April 29, 2025',
      category: 'global',
      requirements: [
        {
          id: '101',
          name: 'Data Processing Records',
          status: 'passed',
          details: 'Processing activities properly documented'
        },
        {
          id: '102',
          name: 'Data Subject Rights',
          status: 'passed',
          details: 'All required rights implemented'
        },
        {
          id: '103',
          name: 'Data Breach Notification',
          status: 'warning',
          details: 'Process exists but needs review'
        },
        {
          id: '104',
          name: 'Privacy by Design',
          status: 'passed',
          details: 'Compliant with Article 25 requirements'
        }
      ]
    },
    {
      id: '2',
      name: 'eIDAS',
      description: 'Electronic Identification, Authentication and Trust Services',
      complianceScore: 88,
      lastChecked: 'April 27, 2025',
      category: 'europe',
      requirements: [
        {
          id: '201',
          name: 'Qualified Electronic Signatures',
          status: 'passed',
          details: 'Compliant implementation'
        },
        {
          id: '202',
          name: 'Timestamp Services',
          status: 'passed',
          details: 'Using qualified timestamp provider'
        },
        {
          id: '203',
          name: 'Certificate Validation',
          status: 'warning',
          details: 'Minor updates needed to validation process'
        }
      ]
    },
    {
      id: '3',
      name: 'HIPAA',
      description: 'Health Insurance Portability and Accountability Act',
      complianceScore: 95,
      lastChecked: 'April 25, 2025',
      category: 'usa',
      requirements: [
        {
          id: '301',
          name: 'Security Rule',
          status: 'passed',
          details: 'All security safeguards implemented'
        },
        {
          id: '302',
          name: 'Privacy Rule',
          status: 'passed',
          details: 'PHI protection measures in place'
        },
        {
          id: '303',
          name: 'Breach Notification',
          status: 'passed',
          details: 'Compliant notification procedures'
        }
      ]
    },
    {
      id: '4',
      name: 'ISO 27001',
      description: 'Information Security Management',
      complianceScore: 86,
      lastChecked: 'April 22, 2025',
      category: 'global',
      requirements: [
        {
          id: '401',
          name: 'Risk Assessment',
          status: 'passed',
          details: 'Comprehensive assessment completed'
        },
        {
          id: '402',
          name: 'Security Controls',
          status: 'warning',
          details: '3 controls need updates'
        },
        {
          id: '403',
          name: 'Continuous Improvement',
          status: 'passed',
          details: 'Monitoring procedures in place'
        },
        {
          id: '404',
          name: 'Documentation',
          status: 'failed',
          details: 'Missing required policy documentation'
        }
      ]
    }
  ];
  
  // Filter standards by selected region
  const filteredStandards = activeRegion === 'all' 
    ? complianceStandards
    : complianceStandards.filter(standard => standard.category === activeRegion);
  
  const handleRunComplianceCheck = (standardId: string) => {
    toast.info(`Running compliance check for ${complianceStandards.find(s => s.id === standardId)?.name}...`);
    
    // Simulate compliance check
    setTimeout(() => {
      toast.success("Compliance check completed");
    }, 2000);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };
  
  // Calculate overall compliance score
  const overallScore = Math.round(
    filteredStandards.reduce((acc, standard) => acc + standard.complianceScore, 0) / 
    (filteredStandards.length || 1)
  );
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Database className="h-7 w-7 text-primary mr-3" />
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Based on {filteredStandards.length} standards
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Standards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-primary">
                  {filteredStandards.length}
                </div>
                <div className="ml-4">
                  <div className="text-sm text-muted-foreground">
                    Regulations tracked
                  </div>
                  <div className="text-xs mt-1">
                    Last updated: Today
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-primary">
                  {filteredStandards.reduce((acc, std) => acc + std.requirements.length, 0)}
                </div>
                <div className="ml-4">
                  <div className="text-sm text-muted-foreground">
                    Individual requirements
                  </div>
                  <div className="text-xs mt-1">
                    <span className="text-green-600 font-medium">
                      {filteredStandards.reduce((acc, std) => 
                        acc + std.requirements.filter(r => r.status === 'passed').length, 0)
                      } passed
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-red-500">
                  {filteredStandards.reduce((acc, std) => 
                    acc + std.requirements.filter(r => r.status === 'failed').length, 0)
                  }
                </div>
                <div className="ml-4">
                  <div className="text-sm text-muted-foreground">
                    Critical issues
                  </div>
                  <div className="text-xs mt-1">
                    <span className="text-yellow-600 font-medium">
                      {filteredStandards.reduce((acc, std) => 
                        acc + std.requirements.filter(r => r.status === 'warning').length, 0)
                      } warnings
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="global" value={activeRegion} onValueChange={setActiveRegion}>
            <div className="flex justify-between items-center mb-3">
              <TabsList>
                <TabsTrigger value="global">
                  <Globe className="h-4 w-4 mr-1" /> Global
                </TabsTrigger>
                <TabsTrigger value="europe">Europe</TabsTrigger>
                <TabsTrigger value="usa">USA</TabsTrigger>
                <TabsTrigger value="all">All Regions</TabsTrigger>
              </TabsList>
              
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {filteredStandards.map(standard => (
                <Card key={standard.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{standard.name}</CardTitle>
                        <CardDescription>{standard.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className={
                        standard.complianceScore >= 90 ? 'bg-green-100 text-green-800 border-green-200' :
                        standard.complianceScore >= 75 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }>
                        {standard.complianceScore}% Compliant
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Compliance Progress</div>
                        <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              standard.complianceScore >= 90 ? 'bg-green-500' : 
                              standard.complianceScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${standard.complianceScore}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last checked: {standard.lastChecked}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Requirements</div>
                        <div className="space-y-2">
                          {standard.requirements.map((req) => (
                            <div key={req.id} className="flex p-2 bg-gray-50 rounded">
                              <div className="mr-2 mt-0.5">
                                {getStatusIcon(req.status)}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{req.name}</div>
                                <div className="text-xs text-muted-foreground">{req.details}</div>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`ml-auto text-xs ${getStatusColor(req.status)}`}
                              >
                                {req.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleRunComplianceCheck(standard.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run Compliance Check
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredStandards.length === 0 && (
                <div className="text-center p-12 bg-gray-50 rounded-lg">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Regulations Found</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no compliance regulations for this region in your profile
                  </p>
                  <Button>
                    Add Compliance Standard
                  </Button>
                </div>
              )}
            </div>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Compliance Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="font-medium mb-1">Compliance Documentation</div>
                  <div className="text-sm text-muted-foreground">
                    Access all compliance certificates and reports
                  </div>
                </div>
                
                <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="font-medium mb-1">Regulatory Updates</div>
                  <div className="text-sm text-muted-foreground">
                    Stay informed about upcoming regulation changes
                  </div>
                </div>
                
                <div className="p-3 border rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="font-medium mb-1">Compliance Training</div>
                  <div className="text-sm text-muted-foreground">
                    Access training materials for your team
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCheck className="h-5 w-5 mr-2" />
                Recent Compliance Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative pl-6 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-green-500 rounded-full -left-1 top-2"></div>
                  <div className="text-sm mb-1 font-medium">GDPR Compliance Check</div>
                  <div className="text-xs text-muted-foreground">Completed today</div>
                </div>
                
                <div className="relative pl-6 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-yellow-500 rounded-full -left-1 top-2"></div>
                  <div className="text-sm mb-1 font-medium">eIDAS Certificate Renewal</div>
                  <div className="text-xs text-muted-foreground">2 days ago</div>
                </div>
                
                <div className="relative pl-6 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-1 top-2"></div>
                  <div className="text-sm mb-1 font-medium">ISO 27001 Documentation Update</div>
                  <div className="text-xs text-muted-foreground">1 week ago</div>
                </div>
                
                <div className="relative pl-6 border-l border-gray-200">
                  <div className="absolute w-2 h-2 bg-green-500 rounded-full -left-1 top-2"></div>
                  <div className="text-sm mb-1 font-medium">HIPAA Training Completed</div>
                  <div className="text-xs text-muted-foreground">2 weeks ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Compliance;
