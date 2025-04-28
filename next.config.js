/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  images: {
    domains: [
      "pbzjrfcoipldrkpytikw.supabase.co",
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
    // Cesium configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      cesium: path.resolve(__dirname, "node_modules/cesium"),
    };

    // Ignore specific warnings
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Cannot find module/,
    ];

    // Handle asset loading for non-server side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle Cesium worker and asset loading
    config.module.rules.push({
      test: /\.(png|gif|jpg|jpeg|svg|xml|json|wasm|workers)$/,
      type: "asset/resource",
      generator: {
        filename: "static/cesium/[hash][ext]",
      },
    });

    return config;
  },

  // Ensure Cesium assets are available
  publicRuntimeConfig: {
    cesiumBaseUrl: "/cesium/",
  },
};

module.exports = nextConfig;
