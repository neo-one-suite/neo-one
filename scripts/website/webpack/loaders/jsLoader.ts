import { Bundle, Stage } from '../../types';
import { babelLoader } from './babelLoader';

export const jsLoader = (options: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  test: /\.jsx?$/,
  include: [
    /react-static-templates\.js/,
    /react-static-browser-plugins\.js/,
    /@reactivex\/ix-esnext-esm/,
    /swimmer\.js/,
  ],
  use: babelLoader(options),
});
