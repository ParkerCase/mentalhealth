/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ldpfadlrxmmgsttkjwop.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pbzjrfcoipldrkpytikw.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
    ],
  },

  // Disable Turbopack to use webpack (required for Cesium)
  experimental: {
    turbo: false,
  },

  // Next.js 15+ no longer uses serverExternalPackages in experimental
  // Removed per update requirements
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

};

module.exports = nextConfig;
