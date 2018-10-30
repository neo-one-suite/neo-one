import * as path from 'path';
import webpack from 'webpack';
import { Stage } from '../types';
import { common } from './common';
import { plugins } from './plugins';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DIST_DIR = path.resolve(APP_ROOT_DIR, 'dist', 'tools');
const TOOLS_PACKAGE = path.resolve(APP_ROOT_DIR, 'packages', 'neo-one-developer-tools-frame');

export const tools = ({ stage }: { readonly stage: Stage }): webpack.Configuration => ({
  ...common({ stage, bundle: 'tools' }),
  entry: {
    tools: path.resolve(TOOLS_PACKAGE, 'src', 'index.tsx'),
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
