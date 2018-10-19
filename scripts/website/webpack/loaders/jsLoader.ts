import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';

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
        ]
      : [],
  ),
  use: babelLoader(options),
});
