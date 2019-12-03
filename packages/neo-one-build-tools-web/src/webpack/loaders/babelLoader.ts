import { Bundle, Stage } from '../../types';
import { babel } from './babel';

export const babelLoader = (options: { readonly stage: Stage; readonly bundle: Bundle }) => ({
  loader: 'babel-loader',
  options: babel({ ...options, cache: true }),
});
