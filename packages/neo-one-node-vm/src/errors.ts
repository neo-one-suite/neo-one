import { makeErrorWithCode } from '@neo-one/utils';

export const InvalidUIntError = makeErrorWithCode(
  'INVALID_UINT',
  (num: number) => `Expected number to be a 32-bit unsigned integer. Got: ${num}`,
);
export const InvalidIntError = makeErrorWithCode(
  'INVALID_INT',
  (num: number) => `Expected number to be a 32-bit signed integer. Got: ${num}`,
);
export const InvalidByteError = makeErrorWithCode(
  'INVALID_BYTE',
  (num: number) => `Expected number to be an 8-bit signed integer. Got: ${num}`,
);
export const InvalidLongError = makeErrorWithCode('INVALID_LONG', () => `Expected 'long' input to be defined`);
