import type { NextConfig } from 'next';
import { staticHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El lint corre como paso propio (npm run lint) en CI.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: '/:path*', headers: staticHeaders(process.env.NODE_ENV !== 'production') }];
  },
};

export default nextConfig;
