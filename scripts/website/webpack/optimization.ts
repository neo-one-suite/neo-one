// @ts-ignore
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
// @ts-ignore
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import webpack from 'webpack';
import { Stage } from '../types';

export const optimization = ({ stage }: { readonly stage: Stage }): webpack.Options.Optimization => {
  if (stage === 'dev') {
    return {
      concatenateModules: true,
    };
  }

  const splitChunks: webpack.Options.SplitChunksOptions = {
    chunks: 'all',
    minSize: 10000,
    minChunks: 1,
    maxAsyncRequests: 5,
    maxInitialRequests: 5,
    name: true,
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        chunks: 'all',
      },
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true,
      },
    },
  };

  return {
    sideEffects: true,
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
    splitChunks,
  };
};
