// @ts-ignore
import MiniHtmlWebpackPlugin from 'mini-html-webpack-plugin';
import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'preview');
const EDITOR_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor');

export const preview = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'preview' }),
  entry: path.resolve(EDITOR_PACKAGE, 'src', 'preview', 'window', 'entry.tsx'),
  output: {
    path: DIST_DIR,
    filename: stage === 'dev' ? '[name].js' : '[name].[hash:8].js',
    chunkFilename: stage === 'dev' ? '[name].js' : 'preview.[name].[chunkHash:8].js',
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
  ].concat(plugins({ stage, bundle: 'preview' })),
});
