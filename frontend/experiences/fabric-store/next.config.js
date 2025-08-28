/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No transpilePackages needed for now
  experimental: {
    externalDir: true
  },
  images: {
    // Use unoptimized to allow any image URL without configuration
    // This is simpler for a demo with various external image sources
    unoptimized: true,
    // Alternative: specify all domains (commented out for now)
    // domains: [
    //   'images.unsplash.com',
    //   'localhost',
    //   'thehearthandhomestore.monday.com',
    //   'cdn.shopify.com',
    //   'i.etsystatic.com'
    // ],
  },
}

module.exports = nextConfig