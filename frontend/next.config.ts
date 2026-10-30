import type { NextConfig } from 'next';

const BACKEND_URL = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.1.15', '192.168.1.15:3000', 'localhost:3000', '127.0.0.1:3000'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL.replace(/\/api\/v1\/?$/, '')}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;

