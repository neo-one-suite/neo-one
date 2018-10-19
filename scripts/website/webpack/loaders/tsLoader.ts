import * as path from 'path';
import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';
import { cacheLoader } from './cacheLoader';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const tsLoader = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: [
    cacheLoader({ stage, bundle, name: 'ts' }),
    'thread-loader',
    babelLoader({ stage, bundle }),
    {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        happyPackMode: true,
        configFile: path.resolve(APP_ROOT_DIR, 'tsconfig', 'tsconfig.es2017.esm.json'),
        onlyCompileBundledFiles: true,
        experimentalFileCaching: true,
        experimentalWatchApi: stage === 'dev',
      },
    },
  ],
});
