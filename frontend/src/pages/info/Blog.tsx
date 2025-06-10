import React from 'react';
import InfoLayout from './InfoLayout';
import { Calendar, Clock, Tag } from 'lucide-react';

const Blog: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'The Future of Document Security: Blockchain Technology',
      excerpt: 'Explore how blockchain technology is revolutionizing document security and verification processes.',
      date: 'April 15, 2023',
      readTime: '5 min read',
      category: 'Technology',
      image: '/blog/blockchain-security.jpg',
    },
    {
      id: 2,
      title: 'Understanding Digital Signatures: A Complete Guide',
      excerpt: 'Learn everything you need to know about digital signatures and their legal implications.',
      date: 'March 28, 2023',
      readTime: '8 min read',
      category: 'Education',
      image: '/blog/digital-signatures.jpg',
    },
    {
      id: 3,
      title: 'Top 5 Security Threats in Document Management',
      excerpt: 'Discover the most common security threats in document management and how to prevent them.',
      date: 'March 10, 2023',
      readTime: '6 min read',
      category: 'Security',
      image: '/blog/security-threats.jpg',
    },
    {
      id: 4,
      title: 'How to Choose the Right Document Verification System',
      excerpt: 'A comprehensive guide to selecting the best document verification system for your business.',
      date: 'February 22, 2023',
      readTime: '7 min read',
      category: 'Business',
      image: '/blog/verification-system.jpg',
    },
  ];

  return (
    <InfoLayout title="Blog">
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg text-gray-600">
            Stay updated with the latest news, insights, and best practices in document security and blockchain technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="border rounded-lg overflow-hidden">
              <div className="h-48 bg-gray-100">
                {/* Image placeholder - replace with actual image */}
                <div className="w-full h-full bg-gray-200"></div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>{post.category}</span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-3">{post.title}</h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <a
                  href="#"
                  className="text-primary hover:underline font-medium"
                  onClick={(e) => e.preventDefault()}
                >
                  Read More
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Categories</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Technology', 'Security', 'Business', 'Education', 'Updates'].map((category) => (
              <a
                key={category}
                href="#"
                className="px-4 py-2 border rounded-full text-gray-600 hover:bg-primary hover:text-white transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                {category}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-4">
            Get the latest updates and insights delivered directly to your inbox.
          </p>
          <form className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </InfoLayout>
  );
};

export default Blog; 