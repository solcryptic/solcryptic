/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables for client-side
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    APP_NAME: 'Carrier Verification System',
    APP_VERSION: '1.0.0'
  },

  // Image optimization
  images: {
    domains: ['localhost'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
  