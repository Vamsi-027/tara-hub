/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  // Temporarily skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Configure externals for both server and client
    config.externals = config.externals || [];
    
    if (!isServer) {
      // Exclude server-only dependencies from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        module: false,
      };
      
      // Mark all Twilio and xmlbuilder related modules as external for client-side
      config.externals.push(
        'twilio',
        'xmlbuilder',
        /^twilio/,
        /^xmlbuilder/
      );
    } else {
      // Server-side externals - make Twilio dynamic import only
      config.externals.push(({ request }, callback) => {
        if (request === 'twilio') {
          return callback(null, 'commonjs ' + request);
        }
        if (request === 'xmlbuilder') {
          return callback(null, 'commonjs ' + request);
        }
        if (/^xmlbuilder\//.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      });
    }
    
    return config;
  },
}

module.exports = nextConfig