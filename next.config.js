/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Add rule for Solidity files
    config.module.rules.push({
      test: /\.sol$/,
      use: 'raw-loader',
    });

    return config;
  },
}

module.exports = nextConfig; 