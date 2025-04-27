// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: [
      "pbzjrfcoipldrkpytikw.supabase.co", // Replace with your Supabase project domain
      "avatars.githubusercontent.com",
      "lh3.googleusercontent.com",
      "graph.facebook.com",
      "platform-lookaside.fbsbx.com",
    ],
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    // Add resolver for Three.js WebGPU issue
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/webgpu": false,
      "three/addons/": "three/examples/jsm/",
    };

    return config;
  },
};

module.exports = nextConfig;
