import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';
import { cacheLoader } from './cacheLoader';

export const tsLoader = ({ stage, bundle }: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.tsx?$/,
  exclude: /node_modules/,
  use: [
    cacheLoader({ stage, bundle, name: 'ts' }),
    stage === 'dev' || process.env.NEO_ONE_CACHE === 'true' ? 'thread-loader' : undefined,
    babelLoader({ stage, bundle }),
    {
      loader: 'ts-loader',
      options: {
        transpileOnly: stage === 'dev' || process.env.NEO_ONE_CACHE === 'true',
        happyPackMode: stage === 'dev' || process.env.NEO_ONE_CACHE === 'true',
        onlyCompileBundledFiles: true,
        experimentalFileCaching: true,
        experimentalWatchApi: stage === 'dev' || process.env.NEO_ONE_CACHE === 'true',
      },
    },
  ].filter((value) => value !== undefined),
});
