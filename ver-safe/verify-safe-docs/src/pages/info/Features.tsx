import React from 'react';
import InfoLayout from './InfoLayout';
import { FileText, Shield, CheckCircle, Lock } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <InfoLayout title="Features">
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Blockchain Security</h2>
            </div>
            <p className="text-gray-600">
              Every document is secured using blockchain technology, making it tamper-proof and providing an immutable record of all transactions and modifications.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Digital Signatures</h2>
            </div>
            <p className="text-gray-600">
              Create legally binding digital signatures with multiple authentication options, including biometric verification and two-factor authentication.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Instant Verification</h2>
            </div>
            <p className="text-gray-600">
              Verify document authenticity instantly through our public verification portal. No account required for verification.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Advanced Encryption</h2>
            </div>
            <p className="text-gray-600">
              State-of-the-art encryption ensures your documents remain secure during transmission and storage.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Additional Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Multi-party signing workflows</li>
            <li>Document version control</li>
            <li>Audit trail and activity logs</li>
            <li>Custom branding options</li>
            <li>API integration capabilities</li>
            <li>Mobile-friendly interface</li>
          </ul>
        </div>
      </div>
    </InfoLayout>
  );
};

export default Features; 