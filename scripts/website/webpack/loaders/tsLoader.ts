import * as path from 'path';
import { Stage } from '../../types';
import { babelLoader } from './babelLoader';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const tsLoader = ({ stage }: { readonly stage: Stage }) => ({
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: [
    { loader: 'thread-loader', options: { poolTimeout: Number.POSITIVE_INFINITY } },
    babelLoader({ stage }),
    {
      loader: 'ts-loader',
      options: {
        happyPackMode: true,
        transpileOnly: stage === 'dev',
        configFile: path.resolve(APP_ROOT_DIR, 'tsconfig', 'tsconfig.es2017.esm.json'),
        onlyCompileBundledFiles: true,
        experimentalFileCaching: true,
        experimentalWatchApi: true,
      },
    },
  ],
});
