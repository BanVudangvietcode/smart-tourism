import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['192.168.1.15', '192.168.1.15:3000', 'localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://192.168.1.15:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
