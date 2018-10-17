import * as path from 'path';
import { Bundle, Stage } from '../../types';
import { babel } from './babel';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const tsLoader = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: [
    {
      loader: 'awesome-typescript-loader',
      options: {
        useTranspileModule: stage === 'dev',
        configFileName: path.resolve(APP_ROOT_DIR, 'tsconfig', 'tsconfig.es2017.esm.json'),
        transpileOnly: true,
        forceIsolatedModules: stage === 'dev',
        babelCore: '@babel/core',
        useBabel: true,
        babelOptions: {
          babelrc: false,
          ...babel({ stage, bundle }),
        },
        useCache: true,
        cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', 'atl', bundle),
      },
    },
  ],
});
