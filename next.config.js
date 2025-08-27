/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle Fabric.js properly
    config.externals = config.externals || [];
    
    // Ensure Fabric.js is bundled properly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
    };
    
    return config;
  },
}

module.exports = nextConfig    

