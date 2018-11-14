// @ts-ignore
import CompressionPlugin from 'compression-webpack-plugin';
import ExtractCssChunksPlugin from 'extract-css-chunks-webpack-plugin';
// @ts-ignore
import HardSourceWebpackPlugin from 'hard-source-webpack-plugin';
import _ from 'lodash';
// @ts-ignore
import LodashModuleReplacementPlugin from 'lodash-webpack-plugin';
import * as path from 'path';
// @ts-ignore
import StatsPlugin from 'stats-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
// @ts-ignore
import WebpackBar from 'webpackbar';
import { Bundle, Stage } from '../types';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

export const plugins = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) =>
  [
    new webpack.DefinePlugin({
      'global.GENTLY': false,
      'process.env': {
        NEO_ONE_DEV: JSON.stringify('true'),
        NEO_ONE_API_URL: JSON.stringify(
          stage === 'prod' && process.env.NEO_ONE_STAGING !== 'true'
            ? 'https://api.neo-one.io/'
            : 'http://localhost:3001/',
        ),
        NEO_ONE_PREVIEW_URL: JSON.stringify(
          stage === 'prod' && process.env.NEO_ONE_STAGING !== 'true'
            ? 'https://course-preview.neo-one.io'
            : 'http://localhost:8080',
        ),
        NEO_ONE_TEST_RUNNER_URL: JSON.stringify(
          stage === 'prod' && process.env.NEO_ONE_STAGING !== 'true'
            ? 'https://test-runner.neo-one.io'
            : 'http://localhost:8081',
        ),
        TSC_NONPOLLING_WATCHER: JSON.stringify('false'),
        TSC_WATCHFILE: JSON.stringify('false'),
        TSC_WATCHDIRECTORY: JSON.stringify('false'),
        NODE_ENV: JSON.stringify(stage === 'dev' ? 'development' : 'production'),
        NODE_DEBUG: JSON.stringify(''),
        REACT_STATIC_DISABLE_PRELOAD: JSON.stringify('true'),
        SC_ATTR: JSON.stringify('data-styled-components'),
      },
    }),
    new webpack.EnvironmentPlugin(
      _.fromPairs(
        Object.entries(process.env).filter(
          ([key]) => key.startsWith('REACT_STATIC') && key !== 'REACT_STATIC_DISABLE_PRELOAD',
        ),
      ),
    ),
    // tslint:disable-next-line no-any deprecation
    new webpack.NormalModuleReplacementPlugin(/^@reactivex\/ix-es2015-cjs(.*)$/, (resource: any) => {
      // tslint:disable-next-line no-object-mutation
      resource.request = resource.request.replace(/^@reactivex\/ix-es2015-cjs(.*)$/, '@reactivex/ix-esnext-esm$1');
    }),
    new WebpackBar({ profile: true }),
  ]
    .concat(
      stage === 'dev' || stage === 'node' || process.env.NEO_ONE_CACHE === 'true'
        ? [
            new HardSourceWebpackPlugin({
              cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', 'hswp', stage, bundle),
              cachePrune: {
                sizeThreshold: 1024 * 1024 * 1024,
              },
            }),
            new HardSourceWebpackPlugin.ExcludeModulePlugin([
              {
                test: /coursesLoader/,
              },
              {
                test: /packagesLoader/,
              },
            ]),
          ]
        : bundle === 'server' || bundle === 'tools'
        ? []
        : [
            new ExtractCssChunksPlugin({
              filename: '[name].[chunkHash:8].css',
              chunkFilename: '[id].[chunkHash:8].css',
            }),
          ],
    )
    .concat(stage === 'dev' || stage === 'node' ? [] : [new LodashModuleReplacementPlugin()])
    .concat(
      stage === 'dev' || stage === 'node' || bundle === 'server' || bundle === 'tools'
        ? []
        : [
            new CompressionPlugin({
              filename: '[path].gz[query]',
              algorithm: 'gzip',
              test: /\.(js|css|html|woff|woff2|json|png|svg|wasm)$/,
              threshold: 1024,
              minRatio: 0.8,
              cache: true,
            }),
          ],
    )
    // tslint:disable-next-line
    .concat(stage === 'dev' ? [] : [new webpack.NoEmitOnErrorsPlugin()])
    .concat(
      process.env.NEO_ONE_ANALYZE === 'true' && stage !== 'node'
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
            }),
            new StatsPlugin('full-stats.json', {
              chunkModules: true,
            }),
          ]
        : [],
    );
