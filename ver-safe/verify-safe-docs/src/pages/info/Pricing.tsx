import React from 'react';
import InfoLayout from './InfoLayout';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for individuals and small businesses',
      features: [
        'Up to 5 documents per month',
        'Basic digital signatures',
        'Document verification',
        'Email support',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Ideal for growing businesses',
      features: [
        'Unlimited documents',
        'Advanced digital signatures',
        'Priority verification',
        '24/7 email support',
        'API access',
        'Custom branding',
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'default' as const,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees',
        'On-premise deployment',
        'Advanced security features',
      ],
      buttonText: 'Contact Sales',
      buttonVariant: 'outline' as const,
    },
  ];

  return (
    <InfoLayout title="Pricing">
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg text-gray-600">
            Choose the perfect plan for your needs. All plans include our core security features and blockchain verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border rounded-lg p-6 flex flex-col">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6 flex-grow">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.buttonVariant}
                className="w-full"
                onClick={() => navigate('/register')}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Need a custom solution?</h2>
          <p className="text-gray-600 mb-4">
            Contact our sales team to discuss your specific requirements.
          </p>
          <Button variant="outline" onClick={() => navigate('/contact')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </InfoLayout>
  );
};

export default Pricing; 