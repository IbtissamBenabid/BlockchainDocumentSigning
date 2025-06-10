
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Profile: React.FC = () => {
  const { authState } = useAuth();
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully');
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Password updated successfully');
  };
  
  const handleEnableMFA = () => {
    toast('Multi-factor authentication setup started');
  };

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
        
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-5xl text-gray-400">
                      {authState.user?.name.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <h3 className="font-medium text-lg">{authState.user?.name}</h3>
                  <p className="text-muted-foreground">{authState.user?.email}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" /> Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        defaultValue={authState.user?.name}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={authState.user?.email}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">
                        Email address cannot be changed
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        placeholder="Your company name"
                      />
                    </div>
                    
                    <Button type="submit">
                      Update Profile
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" /> Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <Button type="submit">
                      Change Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" /> Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Multi-Factor Authentication</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Add an extra layer of security to your account by enabling multi-factor authentication.
                    </p>
                    <Button variant="outline" onClick={handleEnableMFA}>
                      Enable MFA
                    </Button>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Login History</h3>
                    <p className="text-muted-foreground mb-2 text-sm">
                      Recent logins to your account:
                    </p>
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex justify-between">
                          <span>Today, 10:30 AM</span>
                          <span className="text-green-600">Current session</span>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          IP: 192.168.1.1 • Chrome on Windows
                        </div>
                      </div>
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

export default Profile;
