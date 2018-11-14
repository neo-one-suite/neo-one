import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const ModuleNotFoundError = makeErrorWithCode(
  'MODULE_NOT_FOUND_ERROR',
  (path: string) => `Could not find module for ${path}`,
);
