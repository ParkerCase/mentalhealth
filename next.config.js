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
};

module.exports = nextConfig;
