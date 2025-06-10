import React from 'react';
import InfoLayout from './InfoLayout';

const Cookies: React.FC = () => {
  return (
    <InfoLayout title="Cookie Policy">
      <div className="prose max-w-none">
        <div className="mb-8">
          <p className="text-gray-600">
            Last updated: April 29, 2023
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
          <p className="text-gray-600">
            Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide useful information to website owners.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
          <p className="text-gray-600 mb-4">
            We use cookies for the following purposes:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Essential cookies: Required for the website to function properly</li>
            <li>Authentication cookies: To keep you logged in</li>
            <li>Preference cookies: To remember your settings</li>
            <li>Analytics cookies: To understand how you use our website</li>
            <li>Security cookies: To protect your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">3.1 Essential Cookies</h3>
              <p className="text-gray-600">
                These cookies are necessary for the website to function and cannot be switched off. They are usually only set in response to actions made by you, such as setting your privacy preferences or filling in forms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3.2 Performance Cookies</h3>
              <p className="text-gray-600">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3.3 Functionality Cookies</h3>
              <p className="text-gray-600">
                These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">3.4 Targeting Cookies</h3>
              <p className="text-gray-600">
                These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant advertisements.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Managing Cookies</h2>
          <p className="text-gray-600 mb-4">
            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
          </p>
          <p className="text-gray-600">
            To manage cookies in your browser:
          </p>
          <ul className="list-disc list-inside text-gray-600 mb-4">
            <li>Chrome: Settings → Privacy and Security → Cookies</li>
            <li>Firefox: Options → Privacy & Security → Cookies</li>
            <li>Safari: Preferences → Privacy → Cookies</li>
            <li>Edge: Settings → Privacy, search, and services → Cookies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Cookies</h2>
          <p className="text-gray-600">
            Some cookies are placed by third-party services that appear on our pages. We have no control over these cookies and they are subject to the privacy policies of the respective third parties.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Changes to This Policy</h2>
          <p className="text-gray-600">
            We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
          <p className="text-gray-600">
            If you have any questions about our Cookie Policy, please contact us at privacy@securesign.com.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default Cookies; 