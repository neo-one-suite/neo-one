import { Stage } from '../types';
import { cssLoader, fileLoader, jsLoader, tsLoader } from './loaders';

export const rules = (options: { readonly stage: Stage }) => [
  {
    oneOf: [jsLoader(options), tsLoader(options), cssLoader(options), fileLoader()],
  },
];
