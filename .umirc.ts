import { defineConfig } from 'umi';
import routes from './config.router';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  // layout: {},
  fastRefresh: {},
  routes: routes,
  base: './',
  publicPath: '/admin/',
  outputPath: './admin/',
  chainWebpack(config) {
    config.optimization.splitChunks({
      cacheGroups: {
        styles: {
          name: 'styles',
          test: /\.(css|less|scss)$/,
          chunks: 'async',
          minChunks: 1,
          minSize: 0,
        },
      },
    });
  },
  sass: {},
  theme: {
    'primary-color': '#1DA57A',
  },
});
