/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'zh-CN', 'zh-TW'],
    defaultLocale: 'en',
    localeDetection: false,
  },
  async redirects() {
    return [
      { source: '/manual', destination: '/?manual=contents', permanent: false },
      { source: '/manual/:topic', destination: '/?manual=:topic', permanent: false },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
};

module.exports = nextConfig; 