import { AppLayout } from "@/components/AppLayout";

const About = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">About SecureSign</h1>
        <div className="prose max-w-none">
          <p className="text-lg mb-4">
            SecureSign is a cutting-edge document authentication platform that leverages blockchain technology
            to provide secure, verifiable, and tamper-proof document signing and verification services.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="mb-4">
            Our mission is to revolutionize document authentication by providing a secure, transparent,
            and efficient platform that eliminates fraud and ensures the integrity of digital documents.
          </p>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
          <p className="mb-4">
            We envision a world where document authentication is seamless, secure, and accessible to everyone,
            powered by blockchain technology and advanced security measures.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default About; 