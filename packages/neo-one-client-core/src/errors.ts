import { makeErrorWithCode } from '@neo-one/utils';
import { ContractParameter } from './types';

export const InvalidFormatError = makeErrorWithCode(
  'INVALID_FORMAT',
  (reason?: string) => `Invalid format${reason === undefined ? '.' : `: ${reason}`}`,
);
export const VerifyError = makeErrorWithCode(
  'VERIFY',
  (reason?: string) => `Verification failed${reason === undefined ? '.' : `: ${reason}`}`,
);
export const UnsignedBlockError = makeErrorWithCode(
  'UNSIGNED_BLOCK',
  (stringHash: string) => `Block script does not exist because it has not been signed. @ block with hash ${stringHash}`,
);
export const TooManyPublicKeysError = makeErrorWithCode(
  'TOO_MANY_PUBLIC_KEYS',
  (amount: number) => `Too many public keys. Found: ${amount}, Max: 1024`,
);
export const InvalidNumberOfKeysError = makeErrorWithCode(
  'INVALID_NUMBER_OF_KEYS',
  (m: number, amount: number) =>
    `invalid number of keys. Found: ${m} keys, must be between 1 and ${amount} (number of public keys).`,
);

export const InvalidContractParameterError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER',
  (parameter: ContractParameter, expected: ReadonlyArray<ContractParameter['type']>) =>
    `Expected one of ${JSON.stringify(expected)} ` + `ContractParameterTypes, found ${parameter.type}`,
);
