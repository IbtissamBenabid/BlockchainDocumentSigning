import React from 'react';
import InfoLayout from './InfoLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, Heart, Zap } from 'lucide-react';

const Careers: React.FC = () => {
  const navigate = useNavigate();

  const jobOpenings = [
    {
      id: 1,
      title: 'Senior Blockchain Developer',
      location: 'San Francisco, CA',
      type: 'Full-time',
      department: 'Engineering',
    },
    {
      id: 2,
      title: 'Security Engineer',
      location: 'Remote',
      type: 'Full-time',
      department: 'Security',
    },
    {
      id: 3,
      title: 'Product Designer',
      location: 'New York, NY',
      type: 'Full-time',
      department: 'Design',
    },
    {
      id: 4,
      title: 'Customer Success Manager',
      location: 'Remote',
      type: 'Full-time',
      department: 'Customer Success',
    },
  ];

  const benefits = [
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: 'Health & Wellness',
      description: 'Comprehensive health coverage and wellness programs',
    },
    {
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: 'Flexible Work',
      description: 'Remote work options and flexible hours',
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: 'Learning & Development',
      description: 'Continuous learning opportunities and professional growth',
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: 'Team Culture',
      description: 'Collaborative environment with regular team events',
    },
  ];

  return (
    <InfoLayout title="Careers">
      <div className="space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Join Our Team</h2>
          <p className="text-lg text-gray-600">
            We're building the future of document security. Join us in our mission to make secure document management accessible to everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {jobOpenings.map((job) => (
            <div key={job.id} className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>{job.location}</span>
                <span>•</span>
                <span>{job.type}</span>
                <span>•</span>
                <span>{job.department}</span>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/contact')}
              >
                Apply Now
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-8 text-center">Why Join Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 border rounded-lg">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Our Culture</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            At SecureSign, we believe in fostering a culture of innovation, collaboration, and continuous learning. We value diversity and inclusion, and we're committed to creating an environment where everyone can thrive.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={() => navigate('/contact')}>
              Contact HR
            </Button>
            <Button variant="outline" onClick={() => navigate('/about')}>
              Learn More About Us
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Don't See Your Role?</h2>
          <p className="text-gray-600 mb-4">
            We're always looking for talented individuals to join our team. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            Submit Your Resume
          </Button>
        </div>
      </div>
    </InfoLayout>
  );
};

export default Careers; 