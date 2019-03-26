// @ts-ignore
import MiniHtmlWebpackPlugin from 'mini-html-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
// @ts-ignore
import { GenerateSW } from 'workbox-webpack-plugin';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'testRunner');
const EDITOR_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor');

export const testRunner = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'testRunner' }),
  entry: path.resolve(EDITOR_PACKAGE, 'src', 'engine', 'test', 'testRunner.init.ts'),
  output: {
    path: DIST_DIR,
    filename: stage === 'dev' ? '[name].js' : '[name].[hash:8].js',
    chunkFilename: stage === 'dev' ? '[name].js' : 'testRunner.[name].[chunkHash:8].js',
  },
  plugins: [
    new MiniHtmlWebpackPlugin({
      context: {
        title: 'NEO•ONE Test Runner',
      },
      // tslint:disable-next-line no-any
      template: ({ css, js, title, publicPath }: any) =>
        `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>${title}</title>
              ${MiniHtmlWebpackPlugin.generateCSSReferences(css, publicPath)}
              <style>
                body {
                  margin: 0;
                  background-color: #F8F5FD;
                  text-rendering: optimizeLegibility;
                }
              </style>
            </head>
            <body>
              <div id="app"></div>
              ${MiniHtmlWebpackPlugin.generateJSReferences(js, publicPath)}
            </body>
          </html>`,
    }),
  ]
    .concat(plugins({ stage, bundle: 'testRunner' }))
    .concat(
      process.env.NEO_ONE_DISABLE_SW === 'true'
        ? []
        : [
            new GenerateSW({
              swDest: 'sw.js',
              include: [/.(js|css|html|woff|woff2|json|png|svg|wasm)$/],
              clientsClaim: true,
              runtimeCaching: [
                {
                  urlPattern: /^https:\/\/.*.jsdelivr.com/,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'jsdelivr',
                    expiration: {
                      maxEntries: 100000,
                      purgeOnQuotaError: true,
                    },
                    cacheableResponse: {
                      statuses: [0, 200],
                    },
                    matchOptions: {
                      ignoreSearch: true,
                    },
                  },
                },
              ],
              dontCacheBustURLsMatching: /\.(?:\w{8}|\w{32})\./,
              ...(stage === 'prod'
                ? {
                    globDirectory: DIST_DIR,
                    globPatterns: ['**/*.{js,css,html,woff,woff2,json,png,svg,wasm}'],
                    maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
                  }
                : {}),
            }),
          ],
    ),
});
