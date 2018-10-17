import { Stage } from '../../types';
import { babel } from './babel';

export const babelLoader = (options: { readonly stage: Stage }) => ({
  loader: 'babel-loader',
  options: babel(options),
});
