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
        compilerOptions: {
          baseUrl: '../',
          paths: {
            'bn.js': ['node_modules/@neo-one/build-tools/types/bn.js.d.ts'],
          },
          moduleResolution: 'node',
          lib: ['esnext', 'dom'],
          pretty: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          jsx: 'react',
          alwaysStrict: true,
          strict: true,
          skipLibCheck: true,
          noUnusedLocals: false,
          noImplicitReturns: true,
          allowUnusedLabels: false,
          noUnusedParameters: false,
          allowUnreachableCode: false,
          noFallthroughCasesInSwitch: true,
          forceConsistentCasingInFileNames: true,
          importHelpers: true,
          noEmitHelpers: true,
          noEmit: false,
          sourceMap: false,
          inlineSources: true,
          inlineSourceMap: true,
          module: 'esnext',
          target: 'es2017',
          esModuleInterop: false,
          resolveJsonModule: true,
        },
        onlyCompileBundledFiles: true,
        experimentalFileCaching: true,
        experimentalWatchApi: stage === 'dev' || process.env.NEO_ONE_CACHE === 'true',
      },
    },
  ].filter((value) => value !== undefined),
});
