import { makeErrorWithCode } from '@neo-one/utils';
import { ContractParameter } from './types';

export const InvalidFormatError = makeErrorWithCode(
  'INVALID_FORMAT',
  (reason?: string) => `Invalid format${reason === undefined ? '.' : `: ${reason}`}`,
);
export const VerifyError = makeErrorWithCode('VERIFY', (reason: string) => `Verification failed: ${reason}`);
export const UnsignedBlockError = makeErrorWithCode(
  'UNSIGNED_BLOCK',
  () => 'Block script does not exist because it has not been signed.',
);
export const TooManyPublicKeysError = makeErrorWithCode('TOO_MANY_PUBLIC_KEYS', () => 'too many public keys');
export const InvalidNumberOfKeysError = makeErrorWithCode('INVALID_NUMBER_OF_KEYS', () => 'invalid number of keys');

export const InvalidContractParameterError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER',
  (parameter: ContractParameter, expected: ReadonlyArray<ContractParameter['type']>) =>
    `Expected one of ${JSON.stringify(expected)} ` + `ContractParameterTypes, found ${parameter.type}`,
);
