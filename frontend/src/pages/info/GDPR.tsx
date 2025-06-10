import React from 'react';
import InfoLayout from './InfoLayout';

const GDPR: React.FC = () => {
  return (
    <InfoLayout title="GDPR Compliance">
      <div className="prose max-w-none">
        <div className="mb-8">
          <p className="text-gray-600">
            Last updated: April 29, 2023
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-600">
            SecureSign is committed to ensuring the security and protection of the personal information that we process, and to provide a compliant and consistent approach to data protection. We have created this GDPR Compliance Statement to explain our approach to implementing our GDPR compliance program.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Our Commitment</h2>
          <p className="text-gray-600 mb-4">
            We are committed to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Protecting the rights and privacy of all individuals</li>
            <li>Ensuring all personal data is processed lawfully, fairly, and transparently</li>
            <li>Implementing appropriate technical and organizational measures</li>
            <li>Maintaining documentation of our processing activities</li>
            <li>Regularly reviewing and updating our data protection policies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Data Subject Rights</h2>
          <p className="text-gray-600 mb-4">
            Under GDPR, you have the following rights:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Right to be informed</li>
            <li>Right of access</li>
            <li>Right to rectification</li>
            <li>Right to erasure</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object</li>
            <li>Rights related to automated decision making and profiling</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Protection Measures</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">4.1 Technical Measures</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">4.2 Organizational Measures</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Data protection policies and procedures</li>
                <li>Staff training and awareness</li>
                <li>Regular audits and reviews</li>
                <li>Data protection impact assessments</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Processing Agreements</h2>
          <p className="text-gray-600">
            We have Data Processing Agreements (DPAs) in place with all third-party service providers who process personal data on our behalf. These agreements ensure that all parties understand their obligations and responsibilities under GDPR.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Breach Procedures</h2>
          <p className="text-gray-600 mb-4">
            We have implemented procedures to:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Detect, report, and investigate personal data breaches</li>
            <li>Notify affected individuals and relevant authorities</li>
            <li>Document all breaches, regardless of their effect</li>
            <li>Implement measures to prevent future breaches</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
          <p className="text-gray-600">
            When transferring personal data outside the EU/EEA, we ensure appropriate safeguards are in place, such as Standard Contractual Clauses (SCCs) or other approved transfer mechanisms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
          <p className="text-gray-600">
            If you have any questions about our GDPR compliance or wish to exercise your rights under GDPR, please contact our Data Protection Officer at dpo@securesign.com.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Updates to This Statement</h2>
          <p className="text-gray-600">
            We may update this GDPR Compliance Statement from time to time. We will notify you of any changes by posting the new statement on this page and updating the "Last updated" date.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default GDPR; 