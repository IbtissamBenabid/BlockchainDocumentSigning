import React from 'react';
import InfoLayout from './InfoLayout';
import { ChevronDown } from 'lucide-react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: 'What is blockchain document verification?',
      answer: 'Blockchain document verification is a process where document authenticity is verified and recorded on a blockchain network. This creates an immutable record of the document\'s existence and any changes made to it, ensuring its integrity and preventing tampering.',
    },
    {
      question: 'How secure is my data?',
      answer: 'Your data is protected with multiple layers of security including end-to-end encryption, blockchain technology, and secure data centers. We follow industry best practices and maintain various security certifications to ensure your data remains safe.',
    },
    {
      question: 'Do I need to be tech-savvy to use SecureSign?',
      answer: 'Not at all! SecureSign is designed with a user-friendly interface that makes it easy for anyone to use. Our platform guides you through each step of the document signing and verification process.',
    },
    {
      question: 'What types of documents can I sign?',
      answer: 'You can sign virtually any type of document including contracts, agreements, forms, and more. Our platform supports various file formats including PDF, Word, and image files.',
    },
    {
      question: 'Is digital signing legally binding?',
      answer: 'Yes, digital signatures created through SecureSign are legally binding in most jurisdictions. We comply with international e-signature laws including eIDAS, UETA, and ESIGN Act.',
    },
    {
      question: 'How does the verification process work?',
      answer: 'Anyone can verify a document by entering its unique verification code on our public verification portal. The system will check the blockchain record and confirm the document\'s authenticity and any modifications made to it.',
    },
    {
      question: 'What happens if I lose access to my account?',
      answer: 'We have a secure account recovery process in place. You can reset your password using your registered email address or contact our support team for assistance.',
    },
    {
      question: 'Can I integrate SecureSign with other systems?',
      answer: 'Yes, we offer API access for Professional and Enterprise plans, allowing you to integrate our services with your existing systems and workflows.',
    },
  ];

  return (
    <InfoLayout title="Frequently Asked Questions">
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-lg text-gray-600">
            Find answers to common questions about SecureSign and our services.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border rounded-lg">
              <button
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                onClick={(e) => {
                  const content = e.currentTarget.nextElementSibling as HTMLElement;
                  content.style.display = content.style.display === 'none' ? 'block' : 'none';
                }}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
              <div className="p-4 pt-0 text-gray-600 hidden">
                {faq.answer}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Still have questions? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </InfoLayout>
  );
};

export default FAQ; 