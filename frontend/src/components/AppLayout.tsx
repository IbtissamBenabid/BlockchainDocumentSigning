import React from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider
} from "@/components/ui/sidebar";
import { FileText, Upload, CheckSquare, User, Search, Lock, Shield, Brain, FileCheck, Fingerprint, Database } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <FileText className="h-5 w-5" />
    },
    {
      title: "Upload Document",
      path: "/upload",
      icon: <Upload className="h-5 w-5" />
    },
    {
      title: "Sign Documents",
      path: "/sign",
      icon: <CheckSquare className="h-5 w-5" />
    },
    {
      title: "Verify Document",
      path: "/verify",
      icon: <Search className="h-5 w-5" />
    },
    {
      title: "Security",
      path: "/dashboard/security",
      icon: <Shield className="h-5 w-5" />
    },
    // New menu items for innovative features
    {
      title: "AI Analysis",
      path: "/ai-analysis",
      icon: <Brain className="h-5 w-5" />
    },
    {
      title: "Smart Documents",
      path: "/smart-documents",
      icon: <FileCheck className="h-5 w-5" />
    },
    {
      title: "Biometric Auth",
      path: "/biometric",
      icon: <Fingerprint className="h-5 w-5" />
    },
    {
      title: "Compliance",
      path: "/compliance",
      icon: <Database className="h-5 w-5" />
    },
    {
      title: "Profile",
      path: "/profile",
      icon: <User className="h-5 w-5" />
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen w-full">
      <SidebarProvider>
        <Sidebar className="border-r border-border">
          <SidebarContent>
            <div className="py-6 px-4 mb-6">
              <div className="flex items-center gap-2">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold text-primary">SecureSign</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Blockchain Document Authentication</p>
            </div>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        className={`flex items-center gap-3 ${isActive(item.path) ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => navigate(item.path)}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <div className="px-4 py-6 mt-auto">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-500 hover:text-red-600" 
              onClick={() => navigate("/login")}
            >
              Logout
            </Button>
          </div>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
