
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Fingerprint, 
  Scan, 
  Camera, 
  Smartphone, 
  Shield,
  AlertTriangle,
  Check,
  RefreshCcw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const BiometricAuth: React.FC = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'failed'>('not_started');
  
  useEffect(() => {
    // Simulate checking for biometric capabilities
    const checkBiometricSupport = async () => {
      // In a real app, this would check for actual Web Authentication API support
      const isSupported = 'PublicKeyCredential' in window && 
                          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
      
      // For demo purposes, randomly determine if biometrics are supported
      setTimeout(() => {
        const mockSupport = Math.random() > 0.2; // 80% chance it's supported
        setIsBiometricSupported(mockSupport);
      }, 1000);
    };
    
    checkBiometricSupport();
  }, []);
  
  const handleEnableBiometrics = () => {
    setIsScanning(true);
    setEnrollmentStatus('in_progress');
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsScanning(false);
          setIsBiometricEnabled(true);
          setEnrollmentStatus('completed');
          toast.success("Biometric authentication has been enabled");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };
  
  const handleDisableBiometrics = () => {
    setIsBiometricEnabled(false);
    setEnrollmentStatus('not_started');
    toast.info("Biometric authentication has been disabled");
  };
  
  const handleRetryEnrollment = () => {
    setEnrollmentStatus('not_started');
    toast.info("Please try enrollment again");
  };
  
  const renderBiometricStatus = () => {
    if (isBiometricSupported === null) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Checking biometric capabilities...</span>
        </div>
      );
    }
    
    if (isBiometricSupported === false) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Supported</AlertTitle>
          <AlertDescription>
            Your device or browser does not support biometric authentication. 
            Please use a compatible device or browser.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (isBiometricEnabled) {
      return (
        <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4" />
          <AlertTitle>Biometrics Enabled</AlertTitle>
          <AlertDescription>
            You can now sign and authenticate documents using biometric verification.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  const renderEnrollmentUI = () => {
    if (enrollmentStatus === 'in_progress') {
      return (
        <div className="text-center p-8 border rounded-lg">
          <div className="mb-8 relative">
            <div className="relative mx-auto w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 z-0"></div>
              <Fingerprint className="h-16 w-16 text-primary z-10" />
            </div>
          </div>
          <h3 className="text-xl font-medium mb-4">Scanning Fingerprint</h3>
          <p className="text-muted-foreground mb-6">
            Please place your finger on the sensor
          </p>
          <Progress value={progress} className="mb-4" />
          <Button 
            variant="outline" 
            onClick={() => {
              setIsScanning(false);
              setEnrollmentStatus('not_started');
            }}
          >
            Cancel
          </Button>
        </div>
      );
    }
    
    if (enrollmentStatus === 'failed') {
      return (
        <div className="text-center p-8 border border-red-200 rounded-lg bg-red-50">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Enrollment Failed</h3>
          <p className="text-muted-foreground mb-6">
            We couldn't register your biometric data. Please try again.
          </p>
          <Button onClick={handleRetryEnrollment}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }
    
    if (enrollmentStatus === 'completed') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="biometric-toggle">Biometric Authentication</Label>
              <div className="text-sm text-muted-foreground">
                Use fingerprint or face recognition to sign documents
              </div>
            </div>
            <Switch 
              id="biometric-toggle" 
              checked={isBiometricEnabled} 
              onCheckedChange={isBiometricEnabled ? handleDisableBiometrics : handleEnableBiometrics}
            />
          </div>
          
          <div className="pt-4 pb-2">
            <h3 className="font-medium mb-2">Registered Biometrics</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-md">
                <Fingerprint className="h-5 w-5 text-primary mr-2" />
                <div>
                  <div className="font-medium">Fingerprint</div>
                  <div className="text-xs text-muted-foreground">Added on Apr 29, 2025</div>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto">
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center p-8 border rounded-lg">
        <div className="mb-6">
          <div className="mx-auto w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center">
            <Fingerprint className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h3 className="text-xl font-medium mb-2">Set Up Biometric Authentication</h3>
        <p className="text-muted-foreground mb-6">
          Enable secure document signing using your biometric data
        </p>
        <Button onClick={handleEnableBiometrics}>
          Start Enrollment
        </Button>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Fingerprint className="h-7 w-7 text-primary mr-3" />
          <h1 className="text-2xl font-bold">Biometric Authentication</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          {renderBiometricStatus()}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Fingerprint
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isBiometricEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Fingerprint className={`h-8 w-8 ${isBiometricEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
              </CardContent>
              <CardFooter className="text-center text-sm">
                {isBiometricEnabled ? 'Enabled' : 'Not configured'}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Face ID
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
              <CardFooter className="text-center text-sm">
                Coming soon
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Mobile Device
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
              <CardFooter className="text-center text-sm">
                Coming soon
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Biometric Enrollment</CardTitle>
              <CardDescription>
                Configure biometric authentication for secure document signing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderEnrollmentUI()}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">
                    Your biometric data is securely processed and stored on your device only.
                    We use the Web Authentication API (WebAuthn) to verify your identity without
                    ever storing your actual biometric information on our servers.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <Shield className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Local Processing</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Biometric data never leaves your device
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <Scan className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">FIDO2 Compliant</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uses passwordless authentication standards
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <Eye className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Privacy Focused</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Zero-knowledge design protects your privacy
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center mb-2">
                        <RefreshCcw className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Revocable</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You can remove biometric access at any time
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BiometricAuth;
