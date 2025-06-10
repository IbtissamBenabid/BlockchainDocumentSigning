import React from 'react';
import InfoLayout from './InfoLayout';
import { Building2, Users, Target, Globe } from 'lucide-react';

const About: React.FC = () => {
  return (
    <InfoLayout title="About Us">
      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-lg text-gray-600">
            At SecureSign, we're dedicated to revolutionizing document security and verification through blockchain technology. Our mission is to provide businesses and individuals with a secure, efficient, and trustworthy platform for document management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Our Story</h2>
            </div>
            <p className="text-gray-600">
              Founded in 2023, SecureSign emerged from a simple observation: document security and verification needed a modern solution. Our team of blockchain experts and security professionals came together to create a platform that would make document security accessible to everyone.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Our Vision</h2>
            </div>
            <p className="text-gray-600">
              We envision a world where document verification is instant, secure, and universally trusted. By leveraging blockchain technology, we're building the foundation for a more secure and efficient digital future.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Our Team</h2>
            </div>
            <p className="text-gray-600">
              Our diverse team brings together expertise in blockchain technology, cybersecurity, software development, and user experience design. We're united by our passion for creating secure, user-friendly solutions.
            </p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Global Impact</h2>
            </div>
            <p className="text-gray-600">
              We serve clients across the globe, from small businesses to large enterprises. Our platform is designed to meet international standards and comply with various regulatory requirements.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Security First</h3>
              <p className="text-gray-600">We prioritize the security and privacy of our users' data above all else.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-gray-600">We continuously evolve our technology to stay ahead of security threats.</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">User-Centric</h3>
              <p className="text-gray-600">We design our platform with the user experience in mind, making security accessible to all.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Our Journey</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion for security and innovation. Check out our careers page to learn more about joining our team.
          </p>
        </div>
      </div>
    </InfoLayout>
  );
};

export default About; 