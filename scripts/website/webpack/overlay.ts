import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'overlay');
const EDITOR_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-editor');

export const overlay = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'overlay' }),
  entry: {
    overlay: path.resolve(EDITOR_PACKAGE, 'src', 'error', 'iframeScript.tsx'),
  },
  output: {
    path: DIST_DIR,
  },
  plugins: plugins({ stage, bundle: 'overlay' }).concat([
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ]),
});
