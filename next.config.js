/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  // Add Vercel-specific configuration
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Handle Fabric.js and canvas dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      }
    }

    // Handle Fabric.js properly
    config.externals = config.externals || []
    config.externals.push({
      canvas: 'canvas',
      'jsdom': 'jsdom',
    })

    // Add polyfills for Node.js modules on Vercel
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }

    return config
  },
}

module.exports = nextConfig    

