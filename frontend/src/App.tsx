import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DocumentProvider } from "@/contexts/DocumentContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadDocument from "./pages/UploadDocument";
import SignDocument from "./pages/SignDocument";
import VerifyDocument from "./pages/VerifyDocument";
import ShareDocument from "./pages/ShareDocument";
import Profile from "./pages/Profile";
import DashboardSecurity from "./pages/Security";
import AIAnalysis from "./pages/AIAnalysis";
import SmartDocuments from "./pages/SmartDocuments";
import BiometricAuth from "./pages/BiometricAuth";
import Compliance from "./pages/Compliance";
import NotFound from "./pages/NotFound";

// Info Pages
import About from "./pages/info/About";
import Blog from "./pages/info/Blog";
import Careers from "./pages/info/Careers";
import Contact from "./pages/info/Contact";
import FAQ from "./pages/info/FAQ";
import Features from "./pages/info/Features";
import Pricing from "./pages/info/Pricing";
import Privacy from "./pages/info/Privacy";
import Terms from "./pages/info/Terms";
import Cookies from "./pages/info/Cookies";
import GDPR from "./pages/info/GDPR";
import Security from "./pages/info/Security";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DocumentProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Info Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/features" element={<Features />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/gdpr" element={<GDPR />} />
                <Route path="/security" element={<Security />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/upload" 
                  element={
                    <ProtectedRoute>
                      <UploadDocument />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/sign" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/sign/:id" 
                  element={
                    <ProtectedRoute>
                      <SignDocument />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/verify" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/verify/:id" 
                  element={
                    <ProtectedRoute>
                      <VerifyDocument />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/share/:id" 
                  element={
                    <ProtectedRoute>
                      <ShareDocument />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard/security" 
                  element={
                    <ProtectedRoute>
                      <DashboardSecurity />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-analysis" 
                  element={
                    <ProtectedRoute>
                      <AIAnalysis />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/smart-documents" 
                  element={
                    <ProtectedRoute>
                      <SmartDocuments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/biometric" 
                  element={
                    <ProtectedRoute>
                      <BiometricAuth />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/compliance" 
                  element={
                    <ProtectedRoute>
                      <Compliance />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </DocumentProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
