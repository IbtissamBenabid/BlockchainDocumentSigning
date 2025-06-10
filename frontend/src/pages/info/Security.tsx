import React from 'react';
import InfoLayout from './InfoLayout';
import { Shield, Lock, Key, Fingerprint } from 'lucide-react';

const Security: React.FC = () => {
  return (
    <InfoLayout title="Security">
      <div className="space-y-8">
        <div className="prose max-w-none">
          <p className="text-lg text-gray-600 mb-6">
            At SecureSign, we take security seriously. Our platform is built with multiple layers of protection to ensure your documents and data remain secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Blockchain Technology</h2>
            </div>
            <p className="text-gray-600">
              All documents are stored on a secure blockchain network, providing an immutable record of all transactions and ensuring document integrity.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">End-to-End Encryption</h2>
            </div>
            <p className="text-gray-600">
              Your documents are encrypted both in transit and at rest using industry-standard AES-256 encryption.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Multi-Factor Authentication</h2>
            </div>
            <p className="text-gray-600">
              Optional two-factor authentication adds an extra layer of security to your account.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Fingerprint className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Biometric Verification</h2>
            </div>
            <p className="text-gray-600">
              Support for biometric authentication methods including fingerprint and facial recognition.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Security Certifications</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>ISO 27001 certified</li>
            <li>SOC 2 Type II compliant</li>
            <li>GDPR compliant</li>
            <li>Regular security audits</li>
            <li>24/7 security monitoring</li>
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
          <p className="text-gray-600 mb-4">
            We implement strict data protection measures including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Regular data backups</li>
            <li>Secure data centers</li>
            <li>Disaster recovery plans</li>
            <li>Data encryption at rest</li>
            <li>Secure data deletion</li>
          </ul>
        </div>
      </div>
    </InfoLayout>
  );
};

export default Security; 