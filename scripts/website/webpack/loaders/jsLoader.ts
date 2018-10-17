import { Stage } from '../../types';
import { babelLoader } from './babelLoader';

export const jsLoader = (options: { readonly stage: Stage }) => ({
  test: /\.jsx?$/,
  include: [
    /react-static-templates\.js/,
    /react-static-browser-plugins\.js/,
    /@reactivex\/ix-esnext-esm/,
    /swimmer\.js/,
  ],
  use: babelLoader(options),
});
