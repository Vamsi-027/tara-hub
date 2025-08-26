/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No transpilePackages needed for now
  experimental: {
    externalDir: true
  },
  images: {
    domains: ['images.unsplash.com', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        pathname: '/**',
      }
    ],
  },
}

module.exports = nextConfig