import React from 'react';
import InfoLayout from './InfoLayout';

const Terms: React.FC = () => {
  return (
    <InfoLayout title="Terms of Service">
      <div className="prose max-w-none">
        <div className="mb-8">
          <p className="text-gray-600">
            Last updated: April 29, 2023
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-600">
            By accessing or using SecureSign's services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-600">
            SecureSign provides a platform for secure document signing and verification using blockchain technology. Our services include but are not limited to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Digital document signing</li>
            <li>Document verification</li>
            <li>Blockchain-based authentication</li>
            <li>Document storage and management</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p className="text-gray-600 mb-4">
            To use our services, you must:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
          <p className="text-gray-600 mb-4">
            You agree not to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Use the service for any illegal purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Infringe upon the rights of others</li>
            <li>Interfere with or disrupt the service</li>
            <li>Attempt to gain unauthorized access</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
          <p className="text-gray-600">
            The service and its original content, features, and functionality are owned by SecureSign and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
          <p className="text-gray-600">
            In no event shall SecureSign be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
          <p className="text-gray-600">
            We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Changes to Terms</h2>
          <p className="text-gray-600">
            We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p className="text-gray-600">
            These Terms shall be governed and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about these Terms, please contact us at legal@securesign.com.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default Terms; 