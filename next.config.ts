import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  async redirects() {
    // The practice labs moved out of the Playground.
    return [
      { source: '/playground/database', destination: '/labs/database', permanent: true },
      { source: '/playground/storefront', destination: '/labs/storefront', permanent: true },
      { source: '/playground/previews', destination: '/labs/previews', permanent: true },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
}

export default nextConfig
