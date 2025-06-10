import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Shield, CheckCircle, Lock } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">SecureSign</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Log In
            </Button>
            <Button onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Secure Document Authentication with Blockchain
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Create tamper-proof documents with digital signatures verified and secured by blockchain technology. Ensure your documents are protected, traceable, and immutable.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/register')}>
                  Get Started
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/verify')}>
                  Verify a Document
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-lg transform rotate-3"></div>
                <div className="absolute inset-0 bg-primary/5 rounded-lg transform -rotate-3"></div>
                <div className="bg-white p-6 rounded-lg shadow-lg relative">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-bold">Contract Agreement</h3>
                      <p className="text-xs text-muted-foreground">Verified on Blockchain</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-100 rounded-full w-full"></div>
                    <div className="h-3 bg-gray-100 rounded-full w-5/6"></div>
                    <div className="h-3 bg-gray-100 rounded-full w-4/6"></div>
                  </div>
                  <hr className="my-4" />
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Blockchain Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border rounded-lg text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Blockchain Security</h3>
              <p className="text-gray-600">
                Every document is secured using blockchain technology, making it tamper-proof and providing an immutable record.
              </p>
            </div>
            <div className="p-6 border rounded-lg text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Digital Signatures</h3>
              <p className="text-gray-600">
                Easily sign documents digitally with legal validity. Multiple signature options including electronic and biometric.
              </p>
            </div>
            <div className="p-6 border rounded-lg text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verification Portal</h3>
              <p className="text-gray-600">
                Allow third parties to verify document authenticity instantly without needing an account.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to secure your documents?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of businesses and individuals who trust SecureSign for their document security needs.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-white border-white hover:bg-white hover:text-primary"
            onClick={() => navigate('/register')}
          >
            Create Free Account
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h3 className="text-xl font-bold">SecureSign</h3>
              </div>
              <p className="text-sm text-gray-600">
                Blockchain-based document authentication platform for secure, verifiable documents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/features'); }} className="hover:text-primary cursor-pointer">Features</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/security'); }} className="hover:text-primary cursor-pointer">Security</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }} className="hover:text-primary cursor-pointer">Pricing</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/faq'); }} className="hover:text-primary cursor-pointer">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/about'); }} className="hover:text-primary cursor-pointer">About</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/blog'); }} className="hover:text-primary cursor-pointer">Blog</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/careers'); }} className="hover:text-primary cursor-pointer">Careers</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/contact'); }} className="hover:text-primary cursor-pointer">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }} className="hover:text-primary cursor-pointer">Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/terms'); }} className="hover:text-primary cursor-pointer">Terms of Service</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/cookies'); }} className="hover:text-primary cursor-pointer">Cookie Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/gdpr'); }} className="hover:text-primary cursor-pointer">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© {new Date().getFullYear()} SecureSign. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
