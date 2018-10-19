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
          /monaco-textmate/,
          /tapable/,
          /source-map/,
          /@babel\/highlight/,
          /@babel\/code-frame/,
          /chalk/,
          /ansi-styles/,
          /markdown-it-anchor/,
          /markdown-it-table-of-contents/,
          /swimmer/,
          /onigasm/,
          /jest/,
          /callsites/,
        ]
      : [],
  ),
  use: [cacheLoader({ ...options, name: 'js' }), 'thread-loader', babelLoader(options)],
});
