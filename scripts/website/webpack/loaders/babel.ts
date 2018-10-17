import { Stage } from '../../types';
import { browsers } from '../browsers';

export const babel = ({ stage }: { readonly stage: Stage }) => ({
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
});
