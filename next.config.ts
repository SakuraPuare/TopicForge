import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Webpack 配置用于生产构建
  webpack: (config, { isServer }) => {
    // 配置忽略 nodejieba 相关的问题模块
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      os: false,
      stream: false,
      util: false,
    };

    // 忽略有问题的 pre-gyp 模块
    config.externals = config.externals || [];
    config.externals.push({
      '@mapbox/node-pre-gyp': 'commonjs @mapbox/node-pre-gyp',
      'mock-aws-s3': 'mock-aws-s3',
      'aws-sdk': 'aws-sdk',
      nock: 'nock',
    });

    // 配置模块规则以处理问题文件
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });

    // 忽略 nodejieba 的原生模块
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        nodejieba: false,
      };
    }

    return config;
  },

  // 服务器端配置
  serverExternalPackages: ['nodejieba'],
};

export default nextConfig;
