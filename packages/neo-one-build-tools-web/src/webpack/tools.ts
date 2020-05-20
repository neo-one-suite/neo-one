import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');
const TOOLS_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-developer-tools-frame');
const DIST_DIR = path.resolve(TOOLS_PACKAGE, 'dist');

export const tools = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'tools' }),
  entry: {
    'tools.raw': path.resolve(TOOLS_PACKAGE, 'src', 'entry.tsx'),
  },
  output: {
    path: DIST_DIR,
  },
  plugins: plugins({ stage, bundle: 'tools' }).concat([
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ]),
});
