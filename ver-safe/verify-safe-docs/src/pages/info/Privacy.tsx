import React from 'react';
import InfoLayout from './InfoLayout';

const Privacy: React.FC = () => {
  return (
    <InfoLayout title="Privacy Policy">
      <div className="prose max-w-none">
        <div className="mb-8">
          <p className="text-gray-600">
            Last updated: April 29, 2023
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-600">
            At SecureSign, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
          <p className="text-gray-600 mb-4">
            We may collect personal information that you voluntarily provide to us when you register on the service, express an interest in obtaining information about us or our products and services, or otherwise contact us. The personal information we collect may include:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Name and contact information</li>
            <li>Email address</li>
            <li>Company information</li>
            <li>Payment information</li>
            <li>Document information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2">2.2 Usage Data</h3>
          <p className="text-gray-600">
            We may also collect information about how you access and use the service, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Usage patterns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Provide and maintain our service</li>
            <li>Process your transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Communicate with you about products, services, and events</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-600">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized or unlawful processing, accidental loss, destruction, or damage. We use encryption, access controls, and other security measures to protect your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights</h2>
          <p className="text-gray-600 mb-4">
            You have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>The right to access your personal information</li>
            <li>The right to correct inaccurate information</li>
            <li>The right to request deletion of your information</li>
            <li>The right to object to processing</li>
            <li>The right to data portability</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
          <p className="text-gray-600">
            We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about this Privacy Policy, please contact us at privacy@securesign.com.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default Privacy; 