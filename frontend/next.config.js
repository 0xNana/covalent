const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@zama-fhe/relayer-sdk"],

  // Turbopack config (used by `next dev --turbopack`).
  turbopack: {
    resolveAlias: {
      "@react-native-async-storage/async-storage": { browser: "" },
      "pino-pretty": { browser: "" },
      fs: { browser: "" },
      net: { browser: "" },
      tls: { browser: "" },
    },
  },

  // Webpack config (used by `next build`).
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "pino-pretty": false,
      };
    }

    // Ignore React Native packages that MetaMask SDK optionally imports
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      }),
    );

    return config;
  },
};

module.exports = nextConfig;
