import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { addDefaultRules } from './addDefaultRules';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
export const SERVER_DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'server');
const EDITOR_SERVER_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor-server');

export const server = ({ stage }: { readonly stage: Stage }): webpack.Configuration =>
  addDefaultRules({
    ...common({ stage, bundle: 'server' }),
    resolve: {
      mainFields: ['main'],
      aliasFields: [],
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    node: undefined,
    entry:
      stage === 'prod'
        ? {
            resolve: path.resolve(EDITOR_SERVER_PACKAGE, 'src', 'resolve.ts'),
            pkg: path.resolve(EDITOR_SERVER_PACKAGE, 'src', 'pkg.ts'),
          }
        : {
            index: path.resolve(EDITOR_SERVER_PACKAGE, 'src', 'entry.ts'),
          },
    target: 'node',
    output:
      stage === 'prod'
        ? {
            path: SERVER_DIST_DIR,
            filename: '[name].js',
            libraryExport: 'default',
            libraryTarget: 'umd',
          }
        : {
            path: SERVER_DIST_DIR,
            filename: '[name].js',
          },
    plugins: plugins({ stage, bundle: 'server' }).concat([
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
    ]),
  });
