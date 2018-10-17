// @ts-ignore
import MiniHtmlWebpackPlugin from 'mini-html-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';
import { rules } from './rules';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'website');
const EDITOR_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor');

export const preview = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage }),
  entry: path.resolve(EDITOR_PACKAGE, 'src', 'preview', 'window', 'entry.tsx'),
  output: {
    path: DIST_DIR,
    filename: stage === 'dev' ? '[name].js' : '[name].[hash:8].js',
    chunkFilename: stage === 'dev' ? '[name].js' : '[name].[chunkHash:8].js',
  },
  module: {
    rules: rules({ stage }),
  },
  plugins: [
    new MiniHtmlWebpackPlugin({
      context: {
        title: 'NEO•ONE Preview',
      },
      // tslint:disable-next-line no-any
      template: ({ css, js, title, publicPath }: any) =>
        `<!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
              <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
              <link rel="manifest" href="/manifest.json">
              <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
              <meta name="theme-color" content="#ffffff">
              <title>${title}</title>
              ${MiniHtmlWebpackPlugin.generateCSSReferences(css, publicPath)}
              <style>
                body {
                  margin: 0;
                  background-color: #2E2837;
                  text-rendering: optimizeLegibility;
                }
              </style>
            </head>
            <body style="margin: 0px;">
              <div id="app"></div>
              ${MiniHtmlWebpackPlugin.generateJSReferences(js, publicPath)}
            </body>
          </html>`,
    }),
  ].concat(plugins({ stage, bundle: 'preview' })),
});
