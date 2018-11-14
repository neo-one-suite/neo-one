import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';
import { cacheLoader } from './cacheLoader';

export const jsLoader = (options: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.m?jsx?$/,
  include: [
    /react-static-templates\.js/,
    /react-static-browser-plugins\.js/,
    /@reactivex\/ix-esnext-esm/,
    /react-icons/,
    /acorn/,
  ],
  use: [cacheLoader({ ...options, name: 'js' }), 'thread-loader', babelLoader(options)].filter(
    (value) => value !== undefined,
  ),
});
