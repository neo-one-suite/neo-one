// @ts-ignore
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import * as path from 'path';
// @ts-ignore
import TerserWebpackPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { Bundle, Stage } from '../types';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

const getMinifer = (stage: Stage, bundle: Bundle) => {
  const common = {
    cache: path.resolve(APP_ROOT_DIR, 'node_modules', 'terser-webpack-plugin', stage, bundle),
    parallel: true,
    sourceMap: true,
  };

  return new TerserWebpackPlugin({
    ...common,
    terserOptions: {
      ecma: 8,
      compress: {
        ecma: 8,
        inline: bundle !== 'react-static' && bundle !== 'testRunner',
      },
      output: {
        ecma: 8,
      },
    },
  });
};

export const optimization = ({
  stage,
  bundle,
}: {
  readonly stage: Stage;
  readonly bundle: Bundle;
}): webpack.Options.Optimization => {
  if (stage === 'dev') {
    return {
      concatenateModules: true,
    };
  }

  const splitChunks: webpack.Options.SplitChunksOptions = {
    chunks: bundle === 'workers' ? 'async' : 'all',
    minSize: 10000,
    minChunks: 1,
    maxAsyncRequests: 10,
    maxInitialRequests: 10,
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
    providedExports: true,
    usedExports: true,
    concatenateModules: true,
    minimize: true,
    minimizer: [getMinifer(stage, bundle), new OptimizeCSSAssetsPlugin({})],
    splitChunks,
  };
};
