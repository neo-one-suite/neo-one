import { makeErrorWithCode } from '@neo-one/utils';

export const NotFoundError = makeErrorWithCode('NOT_FOUND', () => 'Not found');
export const UnknownTypeError = makeErrorWithCode('UNKNOWN_TYPE', () => 'Unknown type');
export const KeyNotFoundError = makeErrorWithCode(
  'KEY_NOT_FOUND',
  (keyString: string) => `Key ${keyString} not found in database`,
);
export const UnknownChangeTypeError = makeErrorWithCode('UNKNOWN_CHANGE_TYPE', () => 'Unknown change type');
