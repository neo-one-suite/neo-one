import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
// @ts-ignore
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
// @ts-ignore
import WebpackBar from 'webpackbar';
import { Bundle, Stage } from '../types';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

export const plugins = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) =>
  [
    new webpack.EnvironmentPlugin({
      ...process.env,
      NODE_ENV: JSON.stringify(stage === 'dev' ? 'development' : 'production'),
    }),
    // tslint:disable-next-line no-any deprecation
    new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource: any) => {
      // tslint:disable-next-line no-object-mutation
      resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
    }),
    new WebpackBar({ profile: true }),
    new HardSourceWebpackPlugin({
      cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', 'hswp', bundle),
      cachePrune: {
        sizeThreshold: 1024 * 1024 * 1024,
      },
    }),
  ].concat(
    stage === 'dev'
      ? []
      : [
          new ExtractCssChunksPlugin({
            filename: '[name].[chunkHash:8].css',
            chunkFilename: '[id].[chunkHash:8].css',
          }),
        ],
  );
