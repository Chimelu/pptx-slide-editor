/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
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

    return config
  },
}

module.exports = nextConfig    

