const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@zama-fhe/relayer-sdk"],

  
  outputFileTracingRoot: path.join(__dirname),

  turbopack: {
    resolveAlias: {
      "@react-native-async-storage/async-storage": { browser: "" },
      "pino-pretty": { browser: "" },
      fs: { browser: "" },
      net: { browser: "" },
      tls: { browser: "" },
    },
  },

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

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      }),
    );

    return config;
  },
};

module.exports = nextConfig;
