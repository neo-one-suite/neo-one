import { Bundle, Stage } from '../types';
import { cssLoader, exportsLoader, fileLoader, jsLoader, tsLoader } from './loaders';

export const rules = (options: { readonly stage: Stage; readonly bundle: Bundle }) => [
  {
    // tslint:disable-next-line no-any
    oneOf: [jsLoader(options) as any, tsLoader(options) as any, cssLoader(options), fileLoader(), exportsLoader],
  },
];
