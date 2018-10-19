import * as path from 'path';
import { Bundle, Stage } from '../../types';
import { browsers } from '../browsers';

const APP_ROOT_DIR = path.resolve(__dirname, '..', '..', '..', '..');

export const babel = ({
  stage,
  cache,
  bundle,
}: {
  readonly stage: Stage;
  readonly cache?: boolean;
  readonly bundle: Bundle;
}) => {
  const config = {
    configFile: false,
    presets: [
      '@babel/preset-react',
      [
        '@babel/preset-env',
        {
          targets: stage === 'node' ? { node: true } : { browsers },
          modules: false,
          useBuiltIns: 'entry',
          ignoreBrowserslistConfig: true,
        },
      ],
    ],
    plugins: [
      [
        'babel-plugin-styled-components',
        {
          pure: true,
          displayName: stage === 'dev',
        },
      ],
      stage === 'dev' ? 'react-hot-loader/babel' : 'babel-plugin-universal-import',
      '@babel/plugin-syntax-dynamic-import',
      'babel-plugin-lodash',
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-async-generator-functions',
    ],
  };

  if (!cache) {
    return config;
  }

  return {
    ...config,
    cacheDirectory: path.resolve(APP_ROOT_DIR, 'node_modules', '.cache', 'babel', stage, bundle),
    cacheCompression: false,
  };
};
