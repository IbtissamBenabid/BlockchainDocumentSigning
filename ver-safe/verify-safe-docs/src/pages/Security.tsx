
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Lock, 
  Fingerprint, 
  Eye, 
  Key,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const Security: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [passwordScore, setPasswordScore] = useState(85);
  const [securityScore, setSecurityScore] = useState(72);

  const handleTwoFactorToggle = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    if (!twoFactorEnabled) {
      toast.success('Two-factor authentication has been enabled');
      setSecurityScore(prev => Math.min(100, prev + 10));
    } else {
      toast.warning('Two-factor authentication has been disabled');
      setSecurityScore(prev => Math.max(0, prev - 10));
    }
  };

  const handleBiometricToggle = () => {
    setBiometricEnabled(!biometricEnabled);
    if (!biometricEnabled) {
      toast.success('Biometric authentication has been enabled');
      setSecurityScore(prev => Math.min(100, prev + 8));
    } else {
      toast.warning('Biometric authentication has been disabled');
      setSecurityScore(prev => Math.max(0, prev - 8));
    }
  };

  const handleAutoLockToggle = () => {
    setAutoLockEnabled(!autoLockEnabled);
    if (!autoLockEnabled) {
      toast.success('Auto-lock has been enabled');
      setSecurityScore(prev => Math.min(100, prev + 5));
    } else {
      toast.warning('Auto-lock has been disabled');
      setSecurityScore(prev => Math.max(0, prev - 5));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleRunSecurityScan = () => {
    toast.info('Starting security scan...');
    setTimeout(() => {
      toast.success('Security scan completed. No issues found.');
    }, 2000);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Shield className="h-7 w-7 text-primary mr-3" />
          <h1 className="text-2xl font-bold">Security Settings</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Security Score</CardTitle>
                <CardDescription>Your current security rating</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
                    {securityScore}%
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {securityScore >= 80 ? (
                      <div className="flex items-center justify-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Good protection
                      </div>
                    ) : securityScore >= 60 ? (
                      <div className="flex items-center justify-center text-yellow-600">
                        <Info className="h-4 w-4 mr-1" /> Moderate protection
                      </div>
                    ) : (
                      <div className="flex items-center justify-center text-red-600">
                        <AlertTriangle className="h-4 w-4 mr-1" /> Needs improvement
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleRunSecurityScan}
                  >
                    Run Security Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure your account security preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="authentication">Authentication</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-lock">Auto-Lock Application</Label>
                          <div className="text-sm text-muted-foreground">
                            Automatically lock the application after 15 minutes of inactivity
                          </div>
                        </div>
                        <Switch 
                          id="auto-lock" 
                          checked={autoLockEnabled} 
                          onCheckedChange={handleAutoLockToggle}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label htmlFor="password-strength">Password Strength</Label>
                        <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              passwordScore >= 80 ? 'bg-green-500' : 
                              passwordScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${passwordScore}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {passwordScore >= 80 ? 'Strong password' : 
                           passwordScore >= 60 ? 'Moderate password' : 'Weak password'}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="security-history">Recent Security Events</Label>
                        <div className="mt-2 space-y-2 text-sm">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span>Login from new device</span>
                              <span className="text-muted-foreground">Today, 10:30 AM</span>
                            </div>
                          </div>
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between">
                              <span>Password changed</span>
                              <span className="text-muted-foreground">Yesterday, 3:45 PM</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="authentication">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="2fa">Two-Factor Authentication</Label>
                          <div className="text-sm text-muted-foreground">
                            Require a verification code in addition to your password
                          </div>
                        </div>
                        <Switch 
                          id="2fa" 
                          checked={twoFactorEnabled} 
                          onCheckedChange={handleTwoFactorToggle}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="biometric">Biometric Authentication</Label>
                          <div className="text-sm text-muted-foreground">
                            Enable fingerprint or face ID for secure access
                          </div>
                        </div>
                        <Switch 
                          id="biometric" 
                          checked={biometricEnabled} 
                          onCheckedChange={handleBiometricToggle}
                        />
                      </div>
                      
                      <div className="pt-4">
                        <Button variant="outline" className="w-full">
                          <Key className="h-4 w-4 mr-2" />
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="privacy">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Data Sharing</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="analytics">Usage Analytics</Label>
                            <Switch id="analytics" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="marketing">Marketing Communications</Label>
                            <Switch id="marketing" />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-2">Document Privacy</h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="metadata">Store Document Metadata</Label>
                            <Switch id="metadata" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="encrypt">Encrypt All Documents</Label>
                            <Switch id="encrypt" defaultChecked />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Privacy Policy
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Advanced Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Blockchain Security</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="blockchain-network">Default Blockchain Network</Label>
                      <select 
                        id="blockchain-network"
                        className="w-full mt-1 p-2 border rounded-md"
                        defaultValue="ethereum"
                      >
                        <option value="ethereum">Ethereum Mainnet</option>
                        <option value="polygon">Polygon</option>
                        <option value="solana">Solana</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="multi-chain">Multi-Chain Verification</Label>
                      <Switch id="multi-chain" defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Device Management</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Authorized Devices</Label>
                      <div className="text-sm">
                        <div className="p-2 bg-gray-50 rounded flex justify-between">
                          <span>MacBook Pro</span>
                          <span className="text-green-600">Current</span>
                        </div>
                        <div className="p-2 bg-gray-50 rounded flex justify-between mt-2">
                          <span>iPhone 13</span>
                          <Button variant="outline" size="sm" className="h-7 text-xs">Remove</Button>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Manage All Devices
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Security;
