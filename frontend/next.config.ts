import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ['172.20.10.12', '172.20.10.12:3000', 'localhost:3000'],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://172.20.10.12:8080/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
