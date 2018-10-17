import { Bundle, Stage } from '../types';
import { cssLoader, fileLoader, jsLoader, tsLoader } from './loaders';

export const rules = (options: { readonly stage: Stage; readonly bundle: Bundle }) => [
  {
    oneOf: [jsLoader(options), tsLoader(options), cssLoader(options), fileLoader()],
  },
];
