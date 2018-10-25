import { makeErrorWithCode } from '@neo-one/utils';

// tslint:disable-next-line export-name
export const FetchError = makeErrorWithCode(
  'FETCH_ERROR',
  (url: string, status: number, statusText: string) => `Fetch ${url} failed with ${status}: ${statusText}`,
);

// tslint:disable-next-line export-name
export const EmptyBodyError = makeErrorWithCode('EMPTY_BODY_ERROR', (url: string) => `Fetch ${url} had an empty body.`);

export const MissingPackageJSONError = makeErrorWithCode(
  'MISSING_PACKAGE_JSON_ERROR',
  (name: string, version: string) => `${name}@${version} is missing a package.json file.`,
);
