/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Necessário para o build do Dockerfile.frontend (multi-stage espera .next/standalone/server.js)
  output: 'standalone',
  images: {
    domains: ['localhost', 'supabase.co', 'api.qrserver.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
