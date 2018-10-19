import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';
import { cacheLoader } from './cacheLoader';

export const jsLoader = (options: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.jsx?$/,
  include: [/react-static-templates\.js/, /react-static-browser-plugins\.js/, /@reactivex\/ix-esnext-esm/].concat(
    options.stage === 'prod'
      ? [
          /@neo-one\/ec-key/,
          /safe-stable-stringify/,
          /sucrase/,
          /monaco-editor/,
          /tapable/,
          /source-map/,
          /@babel\/highlight/,
          /@babel\/code-frame/,
          /chalk/,
          /ansi-styles/,
          /markdown-it-anchor/,
          /swimmer/,
          /jest-circus/,
        ]
      : [],
  ),
  use: [
    options.stage === 'dev' ? cacheLoader({ ...options, name: 'js' }) : undefined,
    'thread-loader',
    babelLoader(options),
  ].filter((value) => value !== undefined),
});
